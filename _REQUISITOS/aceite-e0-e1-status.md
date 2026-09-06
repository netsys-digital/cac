# Aceite E0 + E1 + E2 — Status

**Data:** 2026-09-05  
**Ambiente:** WSL Ubuntu · monorepo `/app/netsys-apps/cac`  
**Stack operacional:** Docker (`postgres` + `redis` + `api` + `api-worker`); containers `web`/`www` **stopped** para liberar 5178/5179 ao Vite.

---

## E0 — Aceite operacional

| Critério | Resultado | Notas |
|---|---|---|
| Stack sobe (compose) | **PASS** | postgres, redis, api, api-worker Up; web/www stopped de propósito |
| Login + `/me` | **PASS** | `admin@cac.local` / `Admin123!` → 200; `/me` com Bearer → 200 |
| i18n | **PASS** | react-i18next pt/en |
| Tailwind | **PASS** | `@tailwindcss/vite` |
| `/health` + `/ready` | **PASS** | ok / ready (sem prefixo `/api`) |
| CORS dual origin | **PASS** | 5178 + 5179; access via Bearer; refresh cookie |

### Credenciais

| Usuário | Senha | Role |
|---|---|---|
| `admin@cac.local` | `Admin123!` | ADMIN |
| `curador@cac.local` | `Curador123!` | CURADOR |

### Como subir o dia a dia

```bash
docker compose up -d postgres redis api api-worker
docker compose stop web www
npm run dev:web   # http://localhost:5178
npm run dev:www   # http://localhost:5179
```

**Veredito E0:** **PASS**

---

## E1 — Matriz (catálogo e identidade)

| Entregável | Status | Gap / nota |
|---|---|---|
| Organizations CRUD + members + slug | **PARTIAL** | Sem DELETE org/membro |
| Technologies CRUD + workflow | **DONE** | Wizards + **Publicações** (`/my/contents`: editar / reabrir rascunho / excluir draft) |
| Challenges CRUD | **DONE** | Idem |
| Funding offers + success cases gestão operador | **DONE** | Idem — dívida operador ver/editar cadastrados **quitada** |
| Domains country ISO + region | **DONE** | |
| Technologies + DRAFT→IN_REVIEW→PUBLISHED | **DONE** | |
| Challenges + need_type | **DONE** | |
| Projects types | **DONE** | |
| Upload mídia | **PARTIAL** | Só API technologies/:id/media |
| OrgRepresentationRequest E2E | **DONE** API+UI | Smoke browser do selo ainda opcional |
| Zod `@cac/shared` | **DONE** | |
| web register/login/wizard | **DONE** | |
| Testes auth + representação | **DONE** | **11/11 PASS** |

**Veredito E1:** **PASS com gaps menores** (DELETE org/membro, upload UI, smoke selo). Gestão de conteúdos do operador: **DONE**.

---

## E2 — Portal navegável

**Objetivo:** o cliente reconhece o produto visualmente (v13), mesmo sem match completo.

| Entregável | Status | Notas |
|---|---|---|
| www Home: banner + busca + **5 caminhos** | **DONE** | Hero full-bleed + cards 5 caminhos |
| Nav sem Perfil (desktop + mobile) | **DONE** | Desktop: Buscar·Financiamento·Desafio·Ofereça·Casos; mobile: Início·Buscar·Desafio·Casos |
| Product-page da solução + complementares | **DONE** | `/solutions/:slug` |
| Páginas: organização, desafio, projeto | **DONE** | `/organizations|challenges|projects/:slug` |
| web wizards oferta + desafio | **DONE** | `/catalog/technologies/new`, `/catalog/challenges/new` |
| web Meus conteúdos (lista + edição) | **DONE** | UI **Publicações** · rota `/my/contents` + `…/:id/edit` |
| web dashboard operador (cards) | **DONE** | Publicações, contatos, favoritos, interações, views (em breve), likes recebidos |
| Redirect contextual www→web | **DONE** | Home caminhos 3/4 + CTA na product-page + landings |
| Seed parcial ≥5 soluções + ≥3 orgs + ≥3 desafios | **DONE** | Catálogo: **10** techs, **8** orgs, **3** challenges, **2** projects |
| Responsivo básico | **DONE** | Breakpoints do protótipo (grid caminhos / shell) |
| APIs de leitura por slug | **DONE** | tech/org/challenge/project; `isUuid` evita P2023 |
| Busca stub (lista + filtro `q`) | **DONE** | `/search?q=` |
| Seções funding / cases / landings | **DONE** | Navegáveis (conteúdo rico chega em E3/E5) |
| i18n PT/EN das páginas E2 | **DONE** | |

### Critérios “Pronto quando”

| Critério | Status |
|---|---|
| Percorrer Home → detalhe de solução → wizard de desafio | **PASS** | Home → `/search` → `/solutions/:slug` → CTA `Publique um desafio` → `web/catalog/challenges/new` |
| Nav pública sem Perfil | **PASS** | |
| Rótulos alinhados ao requisito | **PASS** | |

### Smoke verificado (2026-09-05)

| Check | Resultado |
|---|---|
| `/health` + `/ready` | 200 |
| GET `/api/technologies` (≥5) | 10 items |
| GET `/api/organizations` (≥3) | 8 items |
| GET `/api/challenges` (≥3) | 3 items |
| Slug techs/orgs/challenges/projects | 200 |
| `npm run build -w @cac/www` | OK |
| `npm run build -w @cac/web` | OK |
| `npm run test -w @cac/api` | **11/11 PASS** |
| Vite www `5179` `/` e `/search` | 200 |

### Slugs de demo úteis

- Solução: `/solutions/recuperacao-pastagens-seca`
- Org: `/organizations/embrapa`
- Desafio: `/challenges/seca-pastagens-cerrado`
- Projeto: `/projects/rede-pastagens-resilientes`

**Veredito E2:** **PASS**

> “O protótipo virou aplicação: a Home dos 5 caminhos está no ar e dá para publicar oferta/desafio.”

---

## E3 — Busca e match

**Objetivo:** correspondência explicável — score + fatores + facets + 3 caminhos.

| Entregável | Status | Notas |
|---|---|---|
| `EmbeddingProvider` + fila Redis + worker | **DONE** | OpenAI ou `KeywordFallbackProvider`; queue `embedding:index`; worker ativo |
| `POST /api/search` + 8 filtros + interpretação | **DONE** | Regras (sem LLM); filtros país/região/tema/ator/setor/maturidade/escala/financiamento |
| Score v1 + `factors[]` + `MATCH_MIN_SCORE` | **DONE** | Pesos via `SCORE_WEIGHTS`; ≥5 fatores; threshold 60 |
| `facets` por content type | **DONE** | solutions / projects / organizations / funders |
| 3 caminhos (sem `whoCanImplement`) | **DONE** | `whoCanSolve` · `whoCanFund` · `relatedProjects` |
| www SearchPage + ResultCard + Facets + ScoreExplanation + MatchPaths + FilterPanel | **DONE** | |
| Seed âncora + funding preview | **DONE** | +1 FunderProfile + 1 FundingOffer; embeddings indexados no seed |
| Testes score + search | **DONE** | **18/18 PASS** (auth+catalog+search) |
| Atalho `POST /api/match/challenge/:id` | **DONE** | Reusa `runSearch` |

### Critérios “Pronto quando”

| Critério | Status |
|---|---|
| Query âncora → scores 94 / 89 / 83 | **PASS** (smoke) |
| Painel “Por que X%?” com ≥3 fatores | **PASS** |
| Composição (facets) visível | **PASS** |
| 3 caminhos na UI; sem “implementar” | **PASS** |

### Smoke (2026-09-06)

```
POST /api/search {"query":"recuperação de pastagens em seca"}
scores [94, 89, 83, 73, 64]
factors 5
paths ['whoCanSolve', 'whoCanFund', 'relatedProjects']
interp seca · pastagens · agricultura/pecuária
```

```
npm run test -w @cac/api  →  18 passed
npm run build -w @cac/www → OK
```

**Veredito E3:** **PASS**

> “Do problema ao caminho de ação: a busca ranqueia, explica e mostra quem resolve, quem financia e projetos relacionados.”

---

## E4 — Conexão e governança

**Objetivo:** fechar o ciclo — da recomendação à ação humana.

| Entregável | Status | Notas |
|---|---|---|
| Connection `targetType` + `targetId` + `objective` | **DONE** | Enums + Zod; rejeita sem campos |
| State machine PENDING→ACCEPTED/DECLINED/EXPIRED/CLOSED | **DONE** | + lembrete a meio do prazo |
| E-mails (solicitação/aceite/recusa/lembrete/expiração) | **DONE** | Nodemailer; SMTP vazio = jsonTransport/log; fila `email:send` |
| SavedItem + Follow | **DONE** | POST/GET/DELETE |
| web: `/connections/new` + `/my/connections` | **DONE** | Login com `returnUrl` |
| Admin: fila curadoria + KPIs | **DONE** | `/admin/curate` · `GET /admin/pending` · `GET /admin/kpis` |
| Admin: representação + domains | **DONE** (já E1) | |
| www CTAs Interesse / Favoritar / Solicitar | **DONE** | `returnUrl` tipado para connection/new |

### Critérios “Pronto quando”

| Critério | Status |
|---|---|
| www → interesse → login → solicitação → e-mail → aceite | **PASS** (API + UI; e-mail log/dev) |
| Curador aprova na fila | **PASS** |
| Admin edita país/região | **PASS** (domains CRUD) |

### Verificação (2026-09-06)

```
npm run test -w @cac/api  →  23/23 PASS
npm run build -w @cac/web → OK
npm run build -w @cac/www → OK
migration 20260906120000_e4_connections applied
```

**Veredito E4:** **PASS**

> “Não é só vitrine: dá para conectar sobre um item concreto e o ofertante responde por e-mail.”

---

## E5 — Financiamento e casos

**Objetivo:** completar as portas 02 e 05 da Home.

| Entregável | Status | Notas |
|---|---|---|
| `FundingOffer` ativa + auto-cadastro | **DONE** | Campos whatFunds/criteria/amountRange/officialUrl + workflow |
| `FunderProfile` diretório + aviso ≠ chamada | **DONE** | www tab directory com warning |
| `SuccessCase` + evidências + necessidades + curadoria | **DONE** | Media + Needs; submit/publish |
| Ofertas e casos no índice de busca | **DONE** | CASE nos results; ofertas no match |
| www `/funding` 2 abas | **DONE** | active × directory |
| www `/cases` + `/cases/:slug` | **DONE** | Caso MZ seed |
| web wizards oferta + caso | **DONE** | `/funding-offers/new`, `/cases/new` |
| whoCanFund só ACTIVE_OFFER | **DONE** | Directory fora do path de match |

### Critérios “Pronto quando”

| Critério | Status |
|---|---|
| 5 caminhos Home → fluxos reais | **PASS** |
| Oferta ativa no match; diretório não | **PASS** (kinds = ACTIVE_OFFER) |
| Caso Moçambique com evidências | **PASS** (`captacao-chuva-horticultura-mocambique`) |

### Verificação (2026-09-06)

```
npm run test -w @cac/api  →  25/25 PASS
offers ativas: 2 · cases: incl. captacao-chuva-horticultura-mocambique
whoCanFund kinds: {ACTIVE_OFFER}
```

**Veredito E5:** **PASS**

> “Financiamento e conhecimento entram no mesmo jogo da busca — a Home está completa.”

---

## E6 — Demo hospedada (Marco 1)

| Entregável | Status | Notas |
|---|---|---|
| Seed volumes §12 | **DONE** | 22 techs · 6 challenges · 6 projects · 5 funders · 5 offers · 4 cases |
| Embeddings pré-calculados | **DONE** | `reindexAllPublished` no seed |
| nginx + `docker-compose.prod.yml` | **DONE** | gateway `:8080` → www / app / api |
| Staging/prod + backup | **DONE** | `.env.prod` · `scripts/backup-postgres.sh` (Postgres, não MySQL) |
| Smoke Marco 1 | **DONE** | `scripts/smoke-marco1.sh` **14/0** |
| Roteiro ~20 min | **DONE** | `_REQUISITOS/roteiro-demo-marco1.md` |
| Freeze do núcleo | **DONE** | documentado no roteiro |

### Critérios “Pronto quando”

| Critério | Status |
|---|---|
| Checklist §8.1 100% verde | **PASS** |
| Ambiente hospedado acessível | **PASS** (`http://localhost:8080`) |
| Roteiro sem falha bloqueante | **PASS** (smoke + gateway URLs) |

### Verificação (2026-09-06)

Ver [`aceite-e6-run.md`](./aceite-e6-run.md). Gateway: `/` · `/app/` · `/api/` · `/health` = 200.

**Veredito E6:** **PASS**

> “Entrega formal do núcleo — jornada completa em ambiente hospedado (gateway nginx).”

---

## Dívida residual (não bloqueia E6)

- [ ] TLS/certbot na frente do gateway (staging/prod reais)
- [ ] SMTP real / Mailhog em staging
- [ ] Upload binário de evidências (hoje caption/evidence notes)
- [ ] Cosine OpenAI em staging (OFFLINE_MODE ok na demo)

**Próximo passo formal:** **E7 — Inglês funcional**
