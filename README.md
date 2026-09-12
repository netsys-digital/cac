# AgriZONE Connect (AZC)

Monorepo da plataforma AgriZONE Connect — **E0–E6 PASS** (Marco 1 demo hospedada).

## Stack

- Node ≥ 20 · Express 5 · Prisma 6 · **PostgreSQL 16** · Redis 7
- React 19 · Vite 7 · Tailwind CSS · i18n (PT/EN/ES) · LibreTranslate (conteúdo do catálogo)
- Apps: `@cac/api` · `@cac/www` · `@cac/web` · packages `@cac/shared` · `@cac/ui`

## Paths

| Ambiente | Path |
|---|---|
| Dev (WSL) | `/app/netsys-apps/cac` |
| Produção (servidor) | `/app/cac` |
| Infra compartilhada | `/app/docker-config` (rede `netsys`, postgres, redis) |

## 1) Ambiente local (do zero)

```bash
cd /app/netsys-apps/cac
bash scripts/bootstrap-local.sh
bash deploy/libretranslate/fetch-models.sh   # .argosmodel no host (~400 MB)
docker compose up -d postgres redis libretranslate api api-worker
docker compose stop web www          # libera 5178/5179 para Vite
npm install
npm run db:migrate -w @cac/api
npm run db:seed -w @cac/api
bash scripts/dev-frontends.sh        # ou: npm run dev:www / npm run dev:web
```

| Serviço | URL |
|---|---|
| Portal (`www`) Vite | http://localhost:5179 |
| Painel (`web`) Vite | http://localhost:5178 |
| API | http://localhost:3003 |
| Postgres | localhost:5433 |
| Redis | localhost:6381 |
| LibreTranslate | localhost:5001 (`fetch-models.sh` no host + imagem `cac-libretranslate`) |

> Não misture Docker `web`/`www` com Vite nas mesmas portas. O container Docker serve build estático (sem HMR).

### Credenciais seed

- Admin: `admin@cac.local` / `Admin123!`
- Curador: `curador@cac.local` / `Curador123!`

### Smoke local

```bash
curl -s http://localhost:3003/health
curl -s -X POST http://localhost:3003/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@cac.local","password":"Admin123!"}'
```

## 2) Produção — instalação do zero

No servidor (`/app/cac`), com docker-config já no ar:

```bash
cd /app/cac
git pull origin main   # ou clone fresco

cp .env.prod.example .env.prod
# Edite obrigatoriamente:
#   CAC_DB_PASSWORD, POSTGRES_PASSWORD (iguais)
#   JWT_SECRET, JWT_REFRESH_SECRET (≥32 chars)
#   CORS_ORIGIN / PUBLIC_* se os domínios mudarem

bash scripts/install-prod.sh
# Banco limpo (apaga schema public do DB cac):
# bash scripts/install-prod.sh --wipe-db
```

| Porta host | App | Domínio |
|---|---|---|
| **8084** | Portal (`www` + `/api`) | `portalcac.netsys.company` |
| **8086** | Gestor (`web` + `/api`) | `gestorcac.netsys.company` |

Nginx do host (TLS com certbot):

```bash
# Anexar: deploy/nginx/netsys-apps-cac.conf.snippet → sites-available
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d portalcac.netsys.company -d gestorcac.netsys.company
```

Smoke no host:

```bash
curl -s http://127.0.0.1:8084/health
curl -sI http://127.0.0.1:8084/ | head -5
# JS deve ser application/javascript — nunca text/html
JS=$(curl -s http://127.0.0.1:8084/ | grep -oE '/assets/[^"]+\.js' | head -1)
curl -sI "http://127.0.0.1:8084$JS" | head -10
bash scripts/smoke-marco1.sh
```

> **Postgres compartilhado:** tabelas do banco `cac` devem ser **OWNER `cac`**.  
> `deploy.sh` / `install-prod.sh` rodam `scripts/prod-db-prepare.sh` antes de recrear a API.

## 3) Publicação em produção (fluxo simples)

**Local (WSL):**

```bash
git add .
git commit -m "..."
git push
```

**No servidor:**

```bash
ssh netsys@servidor
cd /app/cac
bash publish.sh
```

`publish.sh` faz **tudo** em um comando, sempre no modo completo:

1. `git fetch` + `git reset --hard origin/main` (código limpo, sem conflito)
2. Garante infra netsys (postgres/redis)
3. `prod-db-prepare.sh` — corrige ownership + aplica DDL idempotente crítico
4. Build de `api`, `api-worker`, `web`, `www` (fronts sem cache)
5. `up -d --force-recreate` — API roda `prisma migrate deploy` no start
6. Espera API healthy → recria worker, www, web, gateway
7. Smoke test (health, portal, gestor)

Se qualquer passo falhar, o script **para** com mensagem clara e mantém os containers antigos no ar.

### GitHub Actions

O deploy automático foi removido temporariamente para reduzir dor de cabeça em produção — apenas o CI (`.github/workflows/ci.yml`) continua rodando em push/PR. Quando estabilizar, o workflow de deploy pode voltar chamando `bash publish.sh` no servidor.

> `deploy.sh` legado permanece no repositório para referência histórica, mas o comando oficial é **`bash publish.sh`**.

## Variáveis críticas (prod)

| Variável | Uso |
|---|---|
| `CAC_DB_PASSWORD` | Senha do role `cac` no Postgres compartilhado (obrigatória no compose) |
| `PUBLIC_WWW_URL` / `PUBLIC_WEB_URL` | Bake no build Vite dos containers www/web |
| `PUBLIC_API_URL` | Vazio = `/api` same-origin |
| `GATEWAY_PORT_*` | 8084 / 8086 no host |

Arquivos: [`.env.example`](./.env.example) (local) · [`.env.prod.example`](./.env.prod.example) (prod).

## Aceite

Status: [`_REQUISITOS/aceite-e0-e1-status.md`](./_REQUISITOS/aceite-e0-e1-status.md) (E0–E6).  
Roteiro demo: [`_REQUISITOS/roteiro-demo-marco1.md`](./_REQUISITOS/roteiro-demo-marco1.md).
