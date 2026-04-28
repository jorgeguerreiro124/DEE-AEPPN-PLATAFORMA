import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://escola-admin-6.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@escola.pt"
ADMIN_PASSWORD = "admin123"


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=20)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    assert "access_token" in s.cookies
    return s


# ===== Auth =====
class TestAuth:
    def test_login_success(self):
        s = requests.Session()
        r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "admin"
        assert "access_token" in s.cookies and "refresh_token" in s.cookies

    def test_login_wrong_password(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"}, timeout=20)
        assert r.status_code == 401

    def test_me_with_cookie(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/auth/me", timeout=20)
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL

    def test_me_without_cookie(self):
        r = requests.get(f"{BASE_URL}/api/auth/me", timeout=20)
        assert r.status_code == 401

    def test_register_new_user(self):
        s = requests.Session()
        email = f"test_{uuid.uuid4().hex[:8]}@escola.pt"
        r = s.post(f"{BASE_URL}/api/auth/register", json={"email": email, "password": "secret123", "name": "Tester"}, timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["email"] == email
        assert data["role"] == "user"
        assert "access_token" in s.cookies

    def test_register_short_password(self):
        email = f"test_{uuid.uuid4().hex[:8]}@escola.pt"
        r = requests.post(f"{BASE_URL}/api/auth/register", json={"email": email, "password": "123", "name": "T"}, timeout=20)
        assert r.status_code == 422


# ===== Medidas =====
class TestMedidas:
    def test_tags_protected(self):
        r = requests.get(f"{BASE_URL}/api/medidas/tags", timeout=20)
        assert r.status_code == 401

    def test_tags_returns_8(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/medidas/tags", timeout=20)
        assert r.status_code == 200
        tags = r.json()["tags"]
        assert len(tags) == 8
        assert "PEI" in tags


# ===== Students CRUD =====
class TestStudents:
    created_ids = []

    def test_protected_endpoints(self):
        assert requests.get(f"{BASE_URL}/api/students", timeout=20).status_code == 401
        assert requests.post(f"{BASE_URL}/api/students", json={}, timeout=20).status_code == 401
        assert requests.get(f"{BASE_URL}/api/stats", timeout=20).status_code == 401

    def test_create_student(self, admin_session):
        payload = {
            "nome": "TEST_Aluno_" + uuid.uuid4().hex[:6],
            "idade": 10,
            "turma": "5A",
            "escola": "EB Teste",
            "nivel_ensino": "2.º Ciclo",
            "medidas_tags": ["PEI", "Apoio Tutorial"],
            "medidas_notas": "Notas teste",
        }
        r = admin_session.post(f"{BASE_URL}/api/students", json=payload, timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "id" in data and "created_at" in data and "updated_at" in data
        assert data["nome"] == payload["nome"]
        assert "_id" not in data and "owner_id" not in data
        TestStudents.created_ids.append(data["id"])

        # Verify GET
        gr = admin_session.get(f"{BASE_URL}/api/students/{data['id']}", timeout=20)
        assert gr.status_code == 200
        assert gr.json()["nome"] == payload["nome"]

    def test_invalid_idade(self, admin_session):
        payload = {"nome": "X", "idade": 1, "turma": "A", "escola": "B", "nivel_ensino": "1.º Ciclo"}
        r = admin_session.post(f"{BASE_URL}/api/students", json=payload, timeout=20)
        assert r.status_code == 422

    def test_list_no_id_leak(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/students", timeout=20)
        assert r.status_code == 200
        for it in r.json():
            assert "_id" not in it and "owner_id" not in it

    def test_filter_search(self, admin_session):
        # create distinctive
        nome = "TEST_Filter_" + uuid.uuid4().hex[:6]
        cr = admin_session.post(f"{BASE_URL}/api/students", json={
            "nome": nome, "idade": 12, "turma": "7B", "escola": "EBX",
            "nivel_ensino": "3.º Ciclo", "medidas_tags": [], "medidas_notas": "",
        }, timeout=20)
        assert cr.status_code == 200
        TestStudents.created_ids.append(cr.json()["id"])

        r = admin_session.get(f"{BASE_URL}/api/students", params={"search": nome[:10]}, timeout=20)
        assert r.status_code == 200
        assert any(s["nome"] == nome for s in r.json())

        r2 = admin_session.get(f"{BASE_URL}/api/students", params={"nivel_ensino": "3.º Ciclo", "turma": "7B"}, timeout=20)
        assert r2.status_code == 200
        assert all(s["nivel_ensino"] == "3.º Ciclo" and s["turma"] == "7B" for s in r2.json())

    def test_update_student(self, admin_session):
        assert TestStudents.created_ids
        sid = TestStudents.created_ids[0]
        r = admin_session.put(f"{BASE_URL}/api/students/{sid}", json={"idade": 15}, timeout=20)
        assert r.status_code == 200
        assert r.json()["idade"] == 15
        gr = admin_session.get(f"{BASE_URL}/api/students/{sid}", timeout=20)
        assert gr.json()["idade"] == 15

    def test_stats(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/stats", timeout=20)
        assert r.status_code == 200
        d = r.json()
        for k in ["kpis", "por_turma", "por_nivel", "por_escola", "por_medida"]:
            assert k in d
        for k in ["total_alunos", "total_escolas", "total_turmas", "alunos_com_medidas"]:
            assert k in d["kpis"]

    def test_export_csv(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/students/export/csv", timeout=30)
        assert r.status_code == 200
        assert "text/csv" in r.headers.get("content-type", "")
        assert "Nome;Idade" in r.text

    def test_zz_delete_students(self, admin_session):
        for sid in TestStudents.created_ids:
            r = admin_session.delete(f"{BASE_URL}/api/students/{sid}", timeout=20)
            assert r.status_code == 200
            gr = admin_session.get(f"{BASE_URL}/api/students/{sid}", timeout=20)
            assert gr.status_code == 404
