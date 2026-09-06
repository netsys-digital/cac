# Aceite E6 — execução local (Marco 1)

**Data:** 2026-09-06T00:54-03:00  
**Resultado:** **PASS**

## Resumo

- Setup `scripts/e6-setup.sh` executado via WSL Ubuntu-24.04.
- Seed local + volumes demo OK; smoke Marco 1 **14 pass / 0 fail**.
- Compose prod (`docker-compose.prod.yml`) no ar com gateway em `:8080`.
- Correção aplicada: `POSTGRES_PASSWORD` em `.env.prod` / `.env.prod.example` alinhado a `cac_secret` (senha do volume `cac_postgres_data` existente). Auth P1000 na API resolvido sem apagar dados do Postgres.

## Contagens de volume (seed / API pública)

| Entidade | Contagem | Critério smoke |
|----------|----------|----------------|
| technologies (techs) | **22** | ≥10 |
| challenges | **6** | ≥5 |
| projects | **6** | ≥5 |
| funders | **5** | ≥5 |
| offers (funding-offers active) | **5** | ≥3 |
| cases (success-cases) | **4** | ≥3 |

Fonte: `GET http://localhost:8080/api/...` após seed (`seed.ts` + `seed-demo-volumes.ts`).

## Smoke Marco 1 (`scripts/smoke-marco1.sh`)

Base: `API_URL=http://localhost:8080`

```
PASS  login admin
PASS  seed techs ≥10
PASS  seed challenges ≥5
PASS  seed projects ≥5
PASS  seed offers ≥3
PASS  seed funders ≥5
PASS  seed cases ≥3
PASS  caso MZ com evidências
PASS  busca âncora 200
PASS  busca âncora scores/factors/paths
== Result: 14 pass · 0 fail ==
```

Busca âncora: scores `[94, 89, 83]`, `fund_kinds={'ACTIVE_OFFER'}`.

## Gateway URLs verificadas

| URL | HTTP | Notas |
|-----|------|-------|
| http://localhost:8080/health | **200** | `{"status":"ok","brand":"CAC"}` |
| http://localhost:8080/ready | **200** | ready API via gateway |
| http://localhost:8080/ | **200** | portal www |
| http://localhost:8080/app/ | **200** | painel web |
| http://localhost:8080/api/technologies | **200** | API via `/api/` |

Observação: `/api/health` retorna 404 por design (health exposto em `/health`, não sob `/api/`).

## Serviços (compose prod)

| Service | Status |
|---------|--------|
| postgres | healthy |
| redis | healthy |
| api | healthy |
| api-worker | up |
| www | up |
| web | up |
| gateway | up (`0.0.0.0:8080->80`) |

## Backup

- `./backups` no repo está owned por root (não gravável pelo usuário).
- Backup de amostra OK em `/tmp/cac-backups/cac-20260906-005417.sql.gz` (44K).

## Notas de execução

1. Node Linux nvm: `v22.23.2` (`~/.nvm/...`); PATH sem `/mnt/c`.
2. Containers antigos `web`/`www` do compose dev foram parados pelo setup; volume Postgres preservado.
3. Falha inicial: API unhealthy (`P1000` — senha `.env.prod` `cac_secret_change_me` ≠ volume). Corrigido alinhando senha; re-`up` sem wipe de dados.