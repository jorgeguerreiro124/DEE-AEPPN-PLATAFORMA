# PRD — Plataforma de Gestão Pedagógica

## Original Problem Statement
> criar plataforma de gestão pedagógica para inserir dados, tais como nome, idade, turma, medidas educativas, Escola, Nível de ensino

## User Choices
- Autenticação: Login simples (email/senha) — JWT custom
- Funcionalidades: CRUD + Dashboard + Relatórios exportáveis
- Medidas educativas: Tags pré-definidas (multi-seleção) + texto livre
- Idioma: Português (Portugal)
- Visual: Tema claro moderno + toggle escuro

## Architecture
- **Backend**: FastAPI + Motor (MongoDB), JWT cookies (httpOnly, SameSite=None, Secure), bcrypt
- **Frontend**: React 19 + React Router 7, Shadcn UI, Recharts, Tailwind, sonner
- **Tipografia**: Work Sans (display) + IBM Plex Sans (body)

## User Personas
- **Coordenador Pedagógico / Professor**: regista alunos, atribui medidas, consulta estatísticas
- **Direção**: visualiza KPIs e exporta relatórios

## Implemented (2026-04-28)
- Auth: register, login, logout, me (cookies httpOnly)
- Admin seeding: `admin@escola.pt` / `admin123`
- CRUD Alunos (nome, idade, turma, escola, nivel_ensino, medidas_tags[], medidas_notas)
- Filtros: pesquisa por nome, nível e turma
- Dashboard: 4 KPIs + 4 gráficos Recharts (por nível, por turma, por escola, por medida)
- Exportação CSV (servidor) e PDF (impressão estilizada do navegador)
- Theme toggle claro/escuro persistente (localStorage)
- Layout: sidebar desktop + header com avatar e logout
- Testing: 17/17 pytest backend + frontend E2E manual ✅

## Backlog
- **P1**: Seed de dados de exemplo, paginação na tabela quando >50 alunos
- **P1**: Edição de perfil (nome, palavra-passe)
- **P2**: Exportação PDF nativa server-side (reportlab)
- **P2**: Importação CSV em massa
- **P2**: Multi-tenant (cada utilizador vê apenas os seus alunos)
- **P2**: Histórico/auditoria de alterações
- **P3**: Notificações por email (Resend) quando medidas críticas são adicionadas

## Test Credentials
Ver `/app/memory/test_credentials.md`
