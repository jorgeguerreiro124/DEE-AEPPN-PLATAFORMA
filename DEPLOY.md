# Deploy — Firebase Hosting + Cloud Run

## Arquitetura
- **Frontend** (React build estático) → Firebase Hosting (`dee-eppn-plataforma.web.app`)
- **Backend** (FastAPI + Docker) → Cloud Run (`aeppn-backend` em `europe-west1`)
- **Base de dados** → Firestore (projeto `dee-eppn-plataforma`)
- **Anexos / Fotos** → Emergent Object Storage (mantido)

---

## ⚠️ Porque viu a "página de boas-vindas do Firebase"

Quando se faz `firebase deploy` **sem** ter feito antes o `yarn build` do React, a pasta `frontend/build` está vazia e o Firebase serve um `index.html` placeholder. **Já corrigido**:

- ✅ `firebase.json` agora tem um hook `predeploy` que corre `yarn build` automaticamente antes de cada deploy
- ✅ `.firebaserc` criado a apontar para `dee-eppn-plataforma`
- ✅ Build de produção gerado em `frontend/build/`

---

## Opção A — Deploy manual a partir da máquina local

### 1. Instalar e autenticar
```bash
npm install -g firebase-tools
firebase login
```

### 2. Definir o URL do backend Cloud Run

Crie o ficheiro `frontend/.env.production` (já no `.gitignore`) com o URL público do Cloud Run:

```
REACT_APP_BACKEND_URL=https://aeppn-backend-XXXXXXXX-ew.a.run.app
```

> Para descobrir o URL do Cloud Run:
> ```bash
> gcloud run services describe aeppn-backend \
>   --region europe-west1 \
>   --project dee-eppn-plataforma \
>   --format='value(status.url)'
> ```

### 3. Deploy

A partir da raiz do projecto (`/app`):

```bash
firebase deploy --only hosting
```

O `predeploy` corre **automaticamente** `yarn install --frozen-lockfile` + `yarn build` antes do upload.

Para incluir também regras Firestore:
```bash
firebase deploy
```

---

## Opção B — Deploy automático via GitHub Actions (recomendado)

1. Faça **"Save to GitHub"** na interface Emergent
2. Configure os GitHub Secrets em **Settings → Secrets and variables → Actions**:

| Nome | Valor |
|---|---|
| `GCP_SA_KEY` | Conteúdo do JSON da Service Account `aeppn-deploy-290@dee-eppn-plataforma.iam.gserviceaccount.com` |
| `JWT_SECRET` | `ca9f0c0740f085736bd8787af1eb923e5be9a8f2bc4ceebe61309a1a6b4bc644` |
| `ADMIN_EMAIL` | `admin@escola.pt` |
| `ADMIN_PASSWORD` | `Admin123` |
| `EMERGENT_LLM_KEY` | (igual ao `backend/.env`) |

3. O workflow `.github/workflows/deploy.yml` faz:
   - Build & push imagem backend → Artifact Registry → Cloud Run
   - Captura URL do Cloud Run
   - Build frontend com `REACT_APP_BACKEND_URL=<url-cloud-run>` injectado
   - Deploy Firebase Hosting + Firestore rules

URLs finais:
- Frontend: `https://dee-eppn-plataforma.web.app`
- Backend: dinâmico, obtido pelo workflow

---

## Ficheiros-chave de deploy

| Ficheiro | Função |
|---|---|
| `firebase.json` | Config Hosting (build em `frontend/build`, SPA rewrite, predeploy hook) |
| `.firebaserc` | Liga ao projecto `dee-eppn-plataforma` |
| `firestore.rules` | Acesso direto do cliente bloqueado (escrita só via backend) |
| `firestore.indexes.json` | Índices compostos (vazio por agora) |
| `backend/Dockerfile` | Imagem para Cloud Run |
| `.github/workflows/deploy.yml` | CI/CD completo |

---

## Comandos úteis

```bash
# Ver o build localmente antes de fazer deploy
cd frontend && yarn build && npx serve -s build

# Re-executar migração Mongo → Firestore (apenas se necessário)
cd backend && python migrate_mongo_to_firestore.py

# Forçar rebuild + deploy completo
firebase deploy --force
```
