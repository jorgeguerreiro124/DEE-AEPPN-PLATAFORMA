# Activar Deploy Contínuo (CI/CD)

Este guia activa o **deploy automático sempre que houver push para a branch `main`** no GitHub.

## Resumo do que vai acontecer

A cada `git push origin main`:
1. **Backend** → Docker build → push para Artifact Registry → deploy Cloud Run (`aeppn-backend` em `europe-west1`)
2. **Frontend** → `yarn build` com `REACT_APP_BACKEND_URL` injectado automaticamente do URL Cloud Run → upload para Firebase Hosting
3. **Firestore** → rules + indexes actualizados

URLs finais:
- Frontend: https://dee-eppn-plataforma.web.app
- Backend: https://aeppn-backend-XXXX-ew.a.run.app (variável)

---

## Passo 1 — Empurrar o código para o GitHub

Na interface Emergent, clique em **"Save to GitHub"** e seleccione o repositório `allgarviomarafado1976/2departamento.ed.especial.aeppn`.

> O workflow `.github/workflows/deploy.yml` já está no repo. Será detectado pelo GitHub Actions automaticamente após o primeiro push.

---

## Passo 2 — Configurar os GitHub Secrets

No repositório GitHub → **Settings → Secrets and variables → Actions → New repository secret**

Adicione **estes 5 secrets** (sem o primeiro o deploy falha imediatamente):

| Nome do Secret | Valor | Onde obter |
|---|---|---|
| `GCP_SA_KEY` | Conteúdo **completo** do JSON da Service Account `aeppn-deploy-290@dee-eppn-plataforma.iam.gserviceaccount.com` | GCP Console → IAM & Admin → Service Accounts → Keys → Create JSON key. Cole o ficheiro inteiro como valor. ⚠️ **NÃO escolha** `firebase-adminsdk-fbsvc@…` — essa é só do Firebase Admin SDK e não tem permissões Cloud Run. Confirme que clicou na linha cujo email começa por `aeppn-deploy-290`. |
| `JWT_SECRET` | `ca9f0c0740f085736bd8787af1eb923e5be9a8f2bc4ceebe61309a1a6b4bc644` | Já gerado (igual ao `backend/.env`). Pode regenerar com `openssl rand -hex 32`. |
| `ADMIN_EMAIL` | `admin@escola.pt` | Conta admin seed |
| `ADMIN_PASSWORD` | `Admin123` | Palavra-passe inicial — **mude imediatamente após o primeiro login** |
| `EMERGENT_LLM_KEY` | (igual ao valor em `/app/backend/.env`) | Usado para Object Storage de fotos/anexos |

### Permissões IAM necessárias na Service Account

A `aeppn-deploy-290@...` precisa de:
- **Cloud Run Admin** (`roles/run.admin`)
- **Artifact Registry Administrator** (`roles/artifactregistry.admin`) — `writer` **NÃO chega** porque o workflow tem de **criar** o repositório na primeira execução
- **Storage Admin** (`roles/storage.admin`) — para Cloud Build
- **Service Account User** (`roles/iam.serviceAccountUser`)
- **Service Usage Admin** (`roles/serviceusage.serviceUsageAdmin`) — para activar APIs (`run`, `artifactregistry`, etc.)
- **Firebase Admin** (`roles/firebase.admin`) — para deploy Hosting + Firestore rules
- **Cloud Datastore User** (`roles/datastore.user`) — runtime Firestore

Comando rápido (substitua `PROJECT_ID=dee-eppn-plataforma`):
```bash
SA="aeppn-deploy-290@dee-eppn-plataforma.iam.gserviceaccount.com"
for role in run.admin artifactregistry.admin storage.admin iam.serviceAccountUser serviceusage.serviceUsageAdmin firebase.admin datastore.user; do
  gcloud projects add-iam-policy-binding dee-eppn-plataforma --member="serviceAccount:$SA" --role="roles/$role"
done
```

---

## Passo 3 — Disparar o primeiro deploy

Duas formas:

**A) Automático** — faça um commit qualquer e push:
```bash
git commit --allow-empty -m "chore: trigger first CI deploy"
git push origin main
```

**B) Manual** — no GitHub: **Actions → "Deploy to Firebase + Cloud Run" → Run workflow → main → Run**.

---

## Passo 4 — Verificar

1. **GitHub Actions** mostra ambos os jobs verdes (`deploy-backend`, `deploy-frontend`).
2. Aceda a https://dee-eppn-plataforma.web.app — deve ver o ecrã de login da AEPPN.
3. Faça login com `admin@escola.pt` / `Admin123`.
4. **MUDE A PALAVRA-PASSE** no painel de utilizadores imediatamente.

---

## Comportamento esperado em pushes seguintes

| Tipo de alteração | O que acontece |
|---|---|
| Mudança em `backend/**` | Re-build Docker + redeploy Cloud Run + rebuild frontend (porque o URL Cloud Run pode mudar) |
| Mudança em `frontend/**` | Rebuild frontend + redeploy Hosting (backend é reaproveitado mas o job corre na mesma) |
| Mudança em `firestore.rules` / `firestore.indexes.json` | Rules/indexes actualizados |
| Push para outras branches | **Nada acontece** (workflow só corre em `main`) |

---

## Resolução de problemas

| Sintoma | Causa provável | Fix |
|---|---|---|
| "Welcome to Firebase Hosting" no site | Build vazio ou predeploy não correu | Workflow já trata disto (ver step "Build frontend") |
| "Permission denied on resource project" | Service Account sem roles | Aplicar IAM bindings do Passo 2 |
| 404 em rotas como `/students` após refresh | SPA rewrite | Já configurado em `firebase.json` (`** → /index.html`) |
| Frontend abre mas API dá CORS / Network Error | `REACT_APP_BACKEND_URL` errado no build | O workflow injecta o URL do Cloud Run automaticamente — verificar nos logs do job `deploy-frontend` step "Build frontend" |
| Backend devolve 401 em todas as chamadas | `JWT_SECRET` mudou entre deploys | Mantenha o mesmo valor no secret entre deploys; só rode-o quando quiser forçar logout global |

---

## Desactivar deploy contínuo

Se quiser pausar temporariamente:
```bash
# Renomear o workflow para que não corra
git mv .github/workflows/deploy.yml .github/workflows/deploy.yml.disabled
git commit -m "chore: pause CI deploy"
git push
```

Ou, no GitHub: **Actions → Deploy to Firebase + Cloud Run → ⋯ → Disable workflow**.
