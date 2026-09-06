# Climate Action Connect (CAC)

Monorepo da plataforma Climate Action Connect — **E0–E6 PASS** (Marco 1 demo hospedada).

## Stack

- Node ≥ 20 · Express 5 · Prisma 6 · **PostgreSQL 16** · Redis 7
- React 19 · Vite 7 · Tailwind CSS · i18n (PT/EN)
- Apps: `@cac/api` · `@cac/www` · `@cac/web` · packages `@cac/shared` · `@cac/ui`

## Subir com Docker (stack completo)

```bash
cp .env.example .env
docker compose up --build
```

| Serviço | URL |
|---|---|
| Portal (`www`) | http://localhost:5179 |
| Painel (`web`) | http://localhost:5178 |
| API | http://localhost:3003 |
| Postgres | localhost:5433 |
| Redis | localhost:6381 |

## Desenvolvimento local (recomendado no dia a dia)

> **Importante:** não misture Docker `web`/`www` com Vite nas mesmas portas.
> O container Docker serve um **build antigo** (sem HMR). O layout novo só aparece no **Vite**.
> Se `5179` parecer “layout velho”, quase sempre é o nginx Docker — pare com `docker compose stop web www`.

Evita conflito de porta entre Docker nginx e Vite:

```bash
cp .env.example .env
docker compose up -d postgres redis api api-worker
docker compose stop web www   # libera 5178/5179
# ou de uma vez:
bash scripts/dev-frontends.sh
```

Manual:

```bash
npm run dev:www   # http://localhost:5179 — layout atual
npm run dev:web   # http://localhost:5178
```

Hard refresh no browser se ainda parecer cache: `Ctrl+Shift+R`.

### Credenciais seed

- Admin: `admin@cac.local` / `Admin123!`
- Curador: `curador@cac.local` / `Curador123!`

### Smoke E0

```bash
curl -s http://localhost:3003/health
curl -s http://localhost:3003/ready
curl -s -X POST http://localhost:3003/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@cac.local","password":"Admin123!"}'
```

## Demo hospedada (Marco 1 / E6)

Portas no host NETSYS (sem conflito com Usinup `8080`, Agipoint `8081–8083`, Netsys `8085`):

| Porta | App | Domínio |
|---|---|---|
| **8084** | Portal (`www` + `/api`) | `portalcac.netsys.company` |
| **8086** | Gestor (`web` + `/api`) | `gestorcac.netsys.company` |

```bash
cp .env.prod.example .env.prod   # ajuste senhas / CORS
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
# Anexar snippet ao nginx do host:
#   deploy/nginx/netsys-apps-cac.conf.snippet → /etc/nginx/sites-available/netsys-apps
sudo nginx -t && sudo systemctl reload nginx
bash scripts/smoke-marco1.sh          # API em :8084
bash scripts/backup-postgres.sh
```

Local sem DNS: http://localhost:8084 · http://localhost:8086

Roteiro: [`_REQUISITOS/roteiro-demo-marco1.md`](./_REQUISITOS/roteiro-demo-marco1.md)

> PostgreSQL 16 (não MySQL). Backups via `pg_dump`.

## Aceite

Status detalhado: [`_REQUISITOS/aceite-e0-e1-status.md`](./_REQUISITOS/aceite-e0-e1-status.md) (E0–E6).

