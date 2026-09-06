# Aceite E5 — execução

| Item | Resultado |
|------|----------|
| **Status** | **PASS** |
| Data/hora | 2026-09-06T00:37:36-03:00 → 00:40:12 |
| Script | scripts/e5-setup.sh (via wsl -d Ubuntu-24.04) |
| Exit code | 0 |
| Log | _REQUISITOS/_e5-run-log.txt |

## Testes

| Métrica | Valor |
|--------|-------|
| Test files | 6 passed / 6 |
| Tests | **25 passed / 25** |
| Duration | ~10.83s |

Arquivos: connections.test.ts (5), catalog.test.ts (8), funding-cases.test.ts (2), auth.test.ts (3), search.test.ts (2), search-score.test.ts (5).

## Smoke

| Endpoint / checagem | Resultado |
|-------------------|----------|
| GET /api/funding-offers?active=true | **offers: 2** |
| GET /api/success-cases | **cases:** `case-e5-1788665984755`, `captacao-chuva-horticultura-mocambique` |
| POST /api/search (whoCanFund) | 2 itens, scores 70 |
| whoCanFund kinds | **ACTIVE_OFFER** |

whoCanFund amostra:
- ACTIVE_OFFER – Offer E5 1788665984755 (slug offer-e5-1788665984755)
- ACTIVE_OFFER – Chamada pastagens resilientes 2026 (slug chamada-pastagens-resilientes-2026)

## Builds / infra

- @cac/shared build: OK
- Prisma generate + migrate `20260906140000_e5_funding_cases`: OK
- db:seed (orgs/techs/challenges/projects/funders/offers/cases + domains/embeddings): OK
- Docker rebuild cac-api + cac-api-worker: OK
- @cac/api vitest: OK
- @cac/web + @cac/www production build: OK

## TypeScript

Nenhum erro TS; sem correções manuais necessárias nesta execução.