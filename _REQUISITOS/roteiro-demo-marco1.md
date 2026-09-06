# Roteiro da demonstração — Marco 1 (~20 min)

**Ambiente:** `docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build`  
**Portal:** https://portalcac.netsys.company/ (local `:8084`) · **Gestor:** https://gestorcac.netsys.company/ (local `:8086`)  
**Credenciais:** `admin@cac.local` / `Admin123!`

| # | Min | Ação | URL / nota |
|---|---|---|---|
| 1 | 0–2 | Home: banner + busca + **5 caminhos** | `/` |
| 2 | 2–5 | Busca âncora *recuperação de pastagens em seca* → scores 94/89/83 + composição + interpretação | `/search?q=…` |
| 3 | 5–7 | Product-page + “Por que X%?” (≥3 fatores) | `/solutions/recuperacao-pastagens-seca` |
| 4 | 7–9 | Painel dos **3 caminhos** (sem “implementar”) | inline na busca |
| 5 | 9–11 | Financiamento: aba ativa × diretório (aviso) | `/funding` |
| 6 | 11–13 | Caso Moçambique + evidências + necessidades | `/cases/captacao-chuva-horticultura-mocambique` |
| 7 | 13–15 | Publicar desafio (portal→gestor) | `/challenge` → gestor `/catalog/challenges/new` |
| 8 | 15–17 | Conexão sobre o item + aceite | detalhe → gestor login → `/connections/new` → `/my/connections` |
| 9 | 17–20 | Admin: curadoria + KPIs + domains | gestor `/admin/curate` · representation · domains |

## Freeze do núcleo

Após smoke verde (`bash scripts/smoke-marco1.sh`):

1. Não mergear features E7+ sem tag `marco1-freeze`
2. Seed §12 + embeddings pré-calculados são entregáveis
3. Backup: `bash scripts/backup-postgres.sh`

## Checklist §8.1

Ver `_REQUISITOS/requisito-dev-final.md` §8.1 e `_REQUISITOS/aceite-e0-e1-status.md` seção E6.
