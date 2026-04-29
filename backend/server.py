from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import io
import csv
import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, Query
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr


# ---- Mongo ----
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# ---- App ----
app = FastAPI(title="Gestão Pedagógica API")
api_router = APIRouter(prefix="/api")

JWT_ALGORITHM = "HS256"
ACCESS_TTL_MIN = 60 * 24  # 24h for convenience
REFRESH_TTL_DAYS = 7

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ====== Helpers ======
def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TTL_MIN),
        "type": "access",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=REFRESH_TTL_DAYS),
        "type": "refresh",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Response, access: str, refresh: str):
    response.set_cookie(
        key="access_token", value=access, httponly=True, secure=True, samesite="none",
        max_age=ACCESS_TTL_MIN * 60, path="/",
    )
    response.set_cookie(
        key="refresh_token", value=refresh, httponly=True, secure=True, samesite="none",
        max_age=REFRESH_TTL_DAYS * 86400, path="/",
    )


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Não autenticado")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Token inválido")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Utilizador não encontrado")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sessão expirada")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")


# ====== Models ======
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    name: str
    role: str


# Predefined educational measure tags (Portugal context)
MEDIDAS_TAGS = [
    "PEI", "PIT", "Adequação Curricular", "Apoio Tutorial", "Apoio Pedagógico",
    "Tecnologias de Apoio", "Adaptações no Processo de Avaliação",
    "Antecipação", "Reforço Curricular",
]


class StudentBase(BaseModel):
    nome: str = Field(min_length=1)
    idade: int = Field(ge=3, le=99)
    turma: str
    escola: str
    nivel_ensino: str  # e.g. Pré-escolar, 1º Ciclo, 2º Ciclo, 3º Ciclo, Secundário
    tipo_medida: Optional[str] = ""  # Seletiva | Adicional | ""
    medidas_tags: List[str] = []
    medidas_notas: Optional[str] = ""


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    nome: Optional[str] = None
    idade: Optional[int] = None
    turma: Optional[str] = None
    escola: Optional[str] = None
    nivel_ensino: Optional[str] = None
    tipo_medida: Optional[str] = None
    medidas_tags: Optional[List[str]] = None
    medidas_notas: Optional[str] = None


class Student(StudentBase):
    id: str
    created_at: str
    updated_at: str


# ====== Auth Endpoints ======
@api_router.post("/auth/register", response_model=UserResponse)
async def register(payload: RegisterRequest, response: Response):
    email = payload.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email já registado")
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": email,
        "name": payload.name,
        "password_hash": hash_password(payload.password),
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user_doc)
    access = create_access_token(user_id, email)
    refresh = create_refresh_token(user_id)
    set_auth_cookies(response, access, refresh)
    return UserResponse(id=user_id, email=email, name=payload.name, role="user")


@api_router.post("/auth/login", response_model=UserResponse)
async def login(payload: LoginRequest, response: Response):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    access = create_access_token(user["id"], email)
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    return UserResponse(id=user["id"], email=email, name=user["name"], role=user.get("role", "user"))


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


@api_router.get("/auth/me", response_model=UserResponse)
async def me(current=Depends(get_current_user)):
    return UserResponse(
        id=current["id"],
        email=current["email"],
        name=current["name"],
        role=current.get("role", "user"),
    )


# ====== Student Endpoints ======
@api_router.get("/medidas/tags")
async def list_medidas_tags(current=Depends(get_current_user)):
    return {"tags": MEDIDAS_TAGS}


@api_router.post("/students", response_model=Student)
async def create_student(payload: StudentCreate, current=Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": str(uuid.uuid4()),
        **payload.model_dump(),
        "created_at": now,
        "updated_at": now,
        "owner_id": current["id"],
    }
    await db.students.insert_one(doc)
    return Student(**{k: v for k, v in doc.items() if k != "owner_id"})


@api_router.get("/students", response_model=List[Student])
async def list_students(
    search: Optional[str] = None,
    turma: Optional[str] = None,
    nivel_ensino: Optional[str] = None,
    escola: Optional[str] = None,
    current=Depends(get_current_user),
):
    query = {}
    if search:
        query["nome"] = {"$regex": search, "$options": "i"}
    if turma:
        query["turma"] = turma
    if nivel_ensino:
        query["nivel_ensino"] = nivel_ensino
    if (escola):
        query["escola"] = {"$regex": escola, "$options": "i"}
    items = await db.students.find(query, {"_id": 0, "owner_id": 0}).sort("created_at", -1).to_list(2000)
    return [Student(**i) for i in items]


@api_router.get("/students/{student_id}", response_model=Student)
async def get_student(student_id: str, current=Depends(get_current_user)):
    item = await db.students.find_one({"id": student_id}, {"_id": 0, "owner_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    return Student(**item)


@api_router.put("/students/{student_id}", response_model=Student)
async def update_student(student_id: str, payload: StudentUpdate, current=Depends(get_current_user)):
    update = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="Nada a atualizar")
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.students.find_one_and_update(
        {"id": student_id}, {"$set": update}, return_document=True, projection={"_id": 0, "owner_id": 0}
    )
    if not result:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    return Student(**result)


@api_router.delete("/students/{student_id}")
async def delete_student(student_id: str, current=Depends(get_current_user)):
    res = await db.students.delete_one({"id": student_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    return {"ok": True}


# ====== Stats ======
@api_router.get("/stats")
async def stats(current=Depends(get_current_user)):
    total = await db.students.count_documents({})
    pipeline_turma = [{"$group": {"_id": "$turma", "count": {"$sum": 1}}}, {"$sort": {"count": -1}}]
    pipeline_nivel = [{"$group": {"_id": "$nivel_ensino", "count": {"$sum": 1}}}, {"$sort": {"count": -1}}]
    pipeline_escola = [{"$group": {"_id": "$escola", "count": {"$sum": 1}}}, {"$sort": {"count": -1}}]
    pipeline_medidas = [
        {"$match": {"tipo_medida": {"$in": ["Seletiva", "Adicional"]}}},
        {"$unwind": {"path": "$medidas_tags", "preserveNullAndEmptyArrays": False}},
        {"$group": {"_id": "$medidas_tags", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]

    by_turma = await db.students.aggregate(pipeline_turma).to_list(100)
    by_nivel = await db.students.aggregate(pipeline_nivel).to_list(100)
    by_escola = await db.students.aggregate(pipeline_escola).to_list(100)
    by_medidas = await db.students.aggregate(pipeline_medidas).to_list(100)

    def fmt(rows):
        return [{"name": r["_id"] or "—", "value": r["count"]} for r in rows]

    distinct_escolas = len(by_escola)
    distinct_turmas = len(by_turma)
    com_medidas = await db.students.count_documents({"medidas_tags": {"$exists": True, "$ne": []}})

    return {
        "kpis": {
            "total_alunos": total,
            "total_escolas": distinct_escolas,
            "total_turmas": distinct_turmas,
            "alunos_com_medidas": com_medidas,
        },
        "por_turma": fmt(by_turma),
        "por_nivel": fmt(by_nivel),
        "por_escola": fmt(by_escola),
        "por_medida": fmt(by_medidas),
    }


# ====== Export ======
@api_router.get("/students/export/csv")
async def export_csv(current=Depends(get_current_user)):
    items = await db.students.find({}, {"_id": 0, "owner_id": 0}).sort("created_at", -1).to_list(5000)
    output = io.StringIO()
    writer = csv.writer(output, delimiter=";")
    writer.writerow(["Nome", "Idade", "Turma", "Escola", "Nível de Ensino", "Medidas (Tags)", "Notas", "Criado em"])
    for it in items:
        writer.writerow([
            it.get("nome", ""),
            it.get("idade", ""),
            it.get("turma", ""),
            it.get("escola", ""),
            it.get("nivel_ensino", ""),
            ", ".join(it.get("medidas_tags", []) or []),
            (it.get("medidas_notas") or "").replace("\n", " "),
            it.get("created_at", ""),
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=alunos.csv"},
    )


# ====== App startup ======
app.include_router(api_router)

frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    # Indexes
    await db.users.create_index("email", unique=True)
    await db.students.create_index("id", unique=True)
    await db.students.create_index("nome")

    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@escola.pt").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "name": "Administrador",
            "password_hash": hash_password(admin_password),
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Admin seeded: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}},
        )
        logger.info("Admin password updated from env")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
