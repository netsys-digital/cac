# Climate Action Connect — Requisitos de Desenvolvimento (Alta Performance)

> Documento técnico para implementação.  
> **Escopo travado:** [`requisito-final.md`](./requisito-final.md) · **Etapas e valor:** [`requisito-dev-final.md`](./requisito-dev-final.md) · **Negócio:** [`requisitos-apresentacao.md`](./requisitos-apresentacao.md) · **Execução:** [`planejamento.md`](./planejamento.md)  
> **UX vigente:** [protótipo de validação v9](./_MATERIAIS/materiais%20finais/Climate_Action_Connect_Prototipo_Validacao_Daniel_v9.html) · [site navegável v13](./_MATERIAIS/materiais%20finais/Climate_Action_Connect_Preview_Site_Navegavel_v13_Consolidado.html)  
> **Fonte normativa:** [Resumo da validação 02/09/2026](./_MATERIAIS/materiais%20finais/Resumo_Visual_Validacao_Daniel_02-09-2026_ORDEM_DA_REUNIAO_v2_TRANSCRICAO.docx)  
> ⚠️ O protótipo v7 está **superado**. Não usar como referência de layout ou de fluxo.

**Versão:** 2.1  
**Status:** Plano de execução — validação 02/09 + postura de **produto de alta performance** (não MVP técnico)  
**Início:** 2026-09-02  
**Marco 1 — núcleo navegável:** **2026-10-15** — entrega formal ao cliente, com demonstração na data  
**Marco 2 — apresentação:** **novembro/2026** *(data informada pelo cliente — a registrar)*  
**Janela:** ~6 semanas (Bloco A) + ~4 semanas (Bloco B)

### Postura técnica (travada)

O cliente enquadra a entrega como **protótipo navegável** por razões comerciais. A equipe **não** implementa MVP descartável: monorepo, contratos, busca/match, governança, i18n, observabilidade e infra nascem prontos para evoluir (ONU ou Embrapa). Features de superfície seguem a priorização dos marcos; a **fundação** não é cortada.

Apontamentos do cliente: **travados** em [`requisito-final.md`](./requisito-final.md) (§2).

---

## Sumário

1. [Objetivo e meta do deadline](#1-objetivo-e-meta-do-deadline)
2. [Escopo por marco (P0-A / P0-B / P1 / P2)](#2-escopo-por-marco-p0-a--p0-b--p1--p2)
3. [Arquitetura do sistema](#3-arquitetura-do-sistema)
4. [Stack e decisões técnicas (travadas)](#4-stack-e-decisões-técnicas-travadas)
5. [Modelo de dados — implementação](#5-modelo-de-dados--implementação)
6. [API — contratos e prioridade](#6-api--contratos-e-prioridade)
7. [Frontends — `@cac/www` e `@cac/web`](#7-frontends--cacwww-e-cacweb)
8. [Motor de busca e match (produção)](#8-motor-de-busca-e-match-produção)
9. [Infraestrutura e deploy](#9-infraestrutura-e-deploy)
10. [Calendário de implementação](#10-calendário-de-implementação)
11. [Distribuição por dev (equipe 2)](#11-distribuição-por-dev-equipe-2)
12. [Marcos e critérios de done](#12-marcos-e-critérios-de-done)
13. [Riscos do cronograma apertado](#13-riscos-do-cronograma-apertado)
14. [Checklists de demonstração](#14-checklists-de-demonstração)

---

## 1. Objetivo e meta do deadline

### 1.1 Os dois marcos (comerciais) sobre fundação de produto

A validação de 02/09/2026 substituiu o alvo único ("MVP em 15/10") por **dois marcos comerciais**. O cliente quer um **protótipo navegável e utilizável** para a apresentação de novembro. A equipe entrega esses marcos **sobre uma base de produção**, não sobre código descartável.

| Marco | Data | Definição de pronto (o que o cliente vê) | Fundação (o que a equipe garante) |
|---|---|---|---|
| **Marco 1 — núcleo navegável** | 15/10/2026 | Jornada completa hospedada: 5 caminhos, casos, financiamento, representação, conexão sobre o item | Monorepo, API única, contratos Zod, search/match, RBAC, seed, staging, CI, backups |
| **Marco 2 — apresentação** | novembro/2026 | + interface EN, chatbot CAC e **versão local/offline** | i18n completo, worker offline, embeddings pré-calculados, marca configurável, runbook |

Jornada do Marco 1:

```
www: Home (banner + busca + 5 caminhos) → Busca (8 filtros) → Resultados (score + composição por tipo)
     → 3 caminhos do match → Detalhe (product-page / caso / oferta) → CTA de conexão
web: Identificação contextual → Solicitar conexão sobre o item → Aceitar/recusar (e-mail)
     → Publicar desafio · publicar solução · publicar oferta de financiamento · submeter caso
     → Representação institucional (conta → vínculo → solicitar → validar → permissões)
web/admin: Curadoria (soluções, desafios, casos, ofertas) → KPIs → Domínios editáveis → Seed curado
```

Nenhum frontend acessa banco de dados diretamente. **Todas as relações entre entidades passam pela `@cac/api`.**

### 1.1.1 Regras de UI que vêm da validação (não negociáveis)

| Regra | Implicação técnica |
|---|---|
| **Perfil fora do menu principal** | Nav pública = `Buscar · Financiamento · Desafio · Ofereça · Casos`. Conta em `nav-actions`, não em `navlinks`. **Mobile:** rodapé = `Início · Buscar · Desafio · Casos` — **sem** ícone Perfil (decisão estrita em `requisito-final.md`) |
| **Navegação pública aberta** | Rotas de leitura sem guard; login só em ações de escrita |
| **Match = retorno da busca** | Não criar rota/tela de "match". O agregado vem em `POST /api/search` |
| **Sem "quem pode implementar"** | Não implementar esse caminho no agregado do match |
| **Busca restrita à base** | Nenhuma integração de busca externa |
| **Conexão sobre o item** | `Connection` sempre com `targetType` + `targetId` obrigatórios |
| **Composição do resultado** | `POST /api/search` retorna `facets` por `content_type` |
| **Score explicável** | `factors[]` sempre no payload, mesmo em fallback keyword |
| **Domínios editáveis** | CRUD de `Domain` no admin, incluindo países e regiões |
| **Marca substituível** | Nome e logo via env/config, sem hardcode |

### 1.2 Referências cruzadas

| Fonte | Papel neste documento |
|---|---|
| `requisitos.md` v2.0 | Escopo funcional, objetos, RBAC, critérios de aceite |
| **Resumo da validação 02/09/2026** | **Fonte normativa** de escopo e nomenclatura |
| **Protótipo v9 + site v13** | Layout, copy, fluxos UX, estados visuais, seções e rótulos |
| ~~Protótipo v7~~ | **Superado** — não usar |
| Padrão EJC | Monorepo, módulos API, Docker, Prisma/MySQL — **elevado a padrão de produção** |

### 1.3 Premissas de execução

| Premissa | Valor |
|---|---|
| Equipe | 2 devs full-stack (ou 1 backend + 1 frontend) |
| Início efetivo | 02/09/2026 |
| Freeze do núcleo | 15/10/2026 |
| Apresentação | novembro/2026 *(data a confirmar)* |
| Ambiente demo | Staging **e** produção espelhada; hospedagem durante todo o período da demonstração |
| Entregável adicional | **Cópia local/offline** operável sem internet (Bloco B) |
| Idioma UI | PT-BR no Marco 1; **EN funcional obrigatório** no Marco 2 (i18n desde a S1) |
| Marca | Nome e logo via configuração — `APP_BRAND_NAME`, `APP_BRAND_LOGO` |
| Provedor embeddings | OpenAI `text-embedding-3-small` via interface `EmbeddingProvider` |
| Chatbot | Escopo controlado: interpretação + consulta à base. **Sem compromisso de LLM avançado** |
| Orçamento comercial | Features de superfície priorizadas pelo recurso; **fundação técnica não é negociável** |
| **Apps frontend** | **`@cac/www` (portal) + `@cac/web` (painel + admin)** |
| **Backend único** | **`@cac/api`** — único app com Prisma, Redis, SMTP, uploads, workers |
| **Qualidade** | CI (lint + testes + build), healthchecks, logs estruturados, backups MySQL desde S1 |

---

## 2. Escopo por marco (P0-A / P0-B / P1 / P2)

Recorte explícito. **P0-A** cabe no Bloco A (até 15/10); **P0-B** no Bloco B (até novembro). Nada fora de P0 entra se o P0 da semana não estiver verde.

> **Nota de capacidade.** A validação acrescentou casos de sucesso, ofertas ativas de financiamento, representação institucional, i18n, chatbot e versão offline. Itens que antes eram P1 (favoritos, EN) subiram para P0, e o buffer de 3 dias foi consumido. A repriorização semanal deixa de ser opcional.

### P0-A — Obrigatório para o núcleo navegável (15/10)

| Área | Entrega | Novo na v2.x |
|---|---|---|
| **Scaffold** | Monorepo: `api` + `www` + `web` + `@cac/shared` + `@cac/ui`; Docker Compose (MySQL + Redis + api + worker + 3 apps) | ✅ ui desde S1 |
| **i18n** | Infra de tradução desde a S1: nenhuma string hardcoded na UI | ✅ |
| **Branding** | Nome e logo por configuração | ✅ |
| **Auth** | Register, login, JWT + refresh, `/me`, roles RBAC; cookie cross-app | |
| **Identidade contextual** | Rotas públicas sem guard; login disparado pela ação; perfil fora do menu | ✅ |
| **Representação** | `OrgRepresentationRequest`: conta → vínculo → solicitar → validar → permissões | ✅ |
| **Domains** | Seed + **CRUD admin**; `country` completo (ISO 3166-1), `region`, `need_type`, `content_type`, `maturity` | ✅ CRUD e países |
| **Organizations** | CRUD, slug público, verificação manual (admin), membros | |
| **Technologies** | CRUD, workflow `DRAFT → IN_REVIEW → PUBLISHED`, product-page pública, upload imagem/PDF | |
| **Challenges** | CRUD "publicar um desafio" + `need_type` + fluxo de correspondências | rótulo |
| **Projects** | `type: PROJECT \| INITIATIVE \| POLICY \| PROGRAMME` — **buscável**, não só relacionado | ✅ |
| **FundingOffer** | Oferta ativa com prazo, auto-cadastro pela instituição, participa do matching | ✅ |
| **FunderProfile** | Diretório, com aviso de que não implica chamada aberta | |
| **SuccessCase** | CRUD + mídia/evidências + necessidades + workflow de curadoria | ✅ |
| **Search** | `POST /api/search` híbrido; **8 filtros**; `facets` por `content_type`; escopo restrito à base | ✅ facets |
| **Match** | Agregado embutido na busca: score 0–100%, `factors[]` (≥3), **3 caminhos**, threshold 60%. **Sem** "quem pode implementar" | ✅ 3 caminhos |
| **Connections** | `targetType` + `targetId` obrigatórios; objetivo declarado; solicitar/aceitar/recusar/expirar + e-mail | ✅ item-based |
| **SavedItem + Follow** | Favoritar/salvar e seguir a partir do detalhe | ✅ (era P1) |
| **Admin** | KPIs, fila de curadoria unificada (solução, desafio, caso, oferta), verify org, aprovar representação, CRUD domínios | ✅ ampliado |
| **Seed** | 10–15 soluções · 5–10 projetos/iniciativas/políticas · 5–8 desafios · 5–10 financiadores · 3–5 países · orgs curadas | ✅ volumes |
| **`@cac/www`** | Home (5 caminhos) · Busca/resultados · Product-page · Projeto · Organização · **Financiamento (2 abas)** · **Casos** | ✅ |
| **`@cac/web`** | Auth · wizards (solução, desafio, **oferta de financiamento**, **caso**) · conexões · representação · admin | ✅ |
| **Responsividade** | Celular, tablet e desktop; nav mobile inferior | ✅ explícito |
| **Hospedagem** | Staging + produção espelhada; TLS; healthchecks; backup MySQL | ✅ produção |
| **Observabilidade** | Logs estruturados JSON, `/health` + `/ready`, métricas básicas de busca/conexão | ✅ |
| **Testes** | Vitest: auth, score, connection state machine, representação | |

### P0-B — Obrigatório para a apresentação (novembro)

| Área | Entrega |
|---|---|
| **EN funcional** | Catálogo de strings PT/EN completo; alternância preservando rota |
| **Tradução de conteúdo** | `ContentTranslation` por campo; tradução assistida do seed |
| **Revisão profissional** | Janela reservada para validação humana dos textos EN |
| **Chatbot CAC** | `POST /api/chat/message` → interpreta relato → consulta o **mesmo** motor de busca → devolve caminhos |
| **UI do chatbot** | Seção "Converse com a CAC" (web + mobile), com encaminhamento para os resultados |
| **Versão local/offline** | Pacote executável sem internet, com base e embeddings pré-calculados |
| **Runbook** | Procedimento documentado de geração e execução da cópia local |
| **Portabilidade** | Configuração por ambiente para cenário ONU ou Embrapa |

### P1 — Desejável (somente com folga de feature — fundação já coberta)

| Área | Entrega |
|---|---|
| Importação CSV (admin) | `POST /api/admin/import/technologies` |
| Feedback match (útil/não relevante) | `POST /api/match/feedback` |
| Histórico de buscas (logado) | Persistir `MatchEvent` |
| Forgot/reset password | Endpoints completos |
| Audit log UI | Gravar alterações; UI somente leitura admin |
| Export CSV de resultados | Download na busca |

### P2 — Explicitamente depois de novembro

App `admin` separado, **app mobile e WhatsApp**, **replicação avançada de casos**, Local → Global automatizado, chat interno, SSO gov.br, comparador side-by-side, API pública, entrada por voz no chatbot, idiomas ES/FR/AR, integração Sharm el-Sheikh, SSR no www.

---

## 3. Arquitetura do sistema

### 3.1 Princípio: API como fronteira única

```
 @cac/www ──┐
 @cac/web ──┼──► HTTP/JSON ──► @cac/api ──► MySQL + Redis + Mail + Embeddings
            │                        │
            └── @cac/shared ◄────────┘  (schemas Zod, enums, tipos)
```

| Regra | Descrição |
|---|---|
| **Só a API toca dados** | Prisma, Redis, SMTP, uploads, state machines |
| **Frontends são clientes HTTP** | Sem acesso a MySQL/Redis |
| **Relações cross-entity na API** | Joins e agregações expostos como DTOs REST |
| **Contratos em `@cac/shared`** | Schemas Zod definidos uma vez, usados em api + www + web |

### 3.2 Visão de containers (produção)

```
                         Internet (HTTPS / TLS)
                                │
                    ┌───────────▼───────────┐
                    │         nginx          │  rate-limit · gzip · headers
                    └───────────┬───────────┘
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
 climateactionconnect.org      │           /api/* ou api.*
      (@cac/www)                │                     │
   portal :5179          app.* (@cac/web)             │
   descoberta pública    painel :5178                  │
          │                     │                     ▼
          └─────────────────────┴─────────────► @cac/api :3003
                                                      │
                              ┌───────────────────────┼───────────────┐
                              ▼                       ▼               ▼
                          MySQL 8                 Redis 7         uploads/
                          :3308                   :6381           volume
                              ▲                       │
                              │                       ▼
                              └───────────── api-worker (embeddings + e-mail)
```

Ambientes: **dev** (compose local) · **staging** (demo contínua) · **prod** (espelho estável) · **offline** (mesmo build, sem rede externa).

### 3.3 Roteamento nginx (prod/staging)

| Host / path | Destino | App |
|---|---|---|
| `climateactionconnect.org` | `:5179` | `@cac/www` |
| `app.climateactionconnect.org` | `:5178` | `@cac/web` |
| `*/api/*` ou `api.climateactionconnect.org` | `:3003` | `@cac/api` |
| `/uploads/*` | volume estático | api ou nginx |

**Dev local:**

| URL | App |
|---|---|
| `http://localhost:5179` | www |
| `http://localhost:5178` | web |
| `http://localhost:3003` | api |

### 3.4 Monorepo

```
cac/
├── apps/
│   ├── api/                 # @cac/api      — backend único (porta 3003)
│   ├── www/                 # @cac/www      — portal público (porta 5179)
│   └── web/                 # @cac/web      — painel autenticado + admin (porta 5178)
│
├── packages/
│   ├── shared/              # @cac/shared   — schemas Zod, enums, constantes
│   └── ui/                  # @cac/ui       — ScoreBadge, TagList, StatusBadge, tokens (desde S1)
│
├── scripts/
│   ├── seed.ts
│   └── import-technologies.ts
├── docs/
├── docker-compose.yml
├── docker-compose.prod.yml
├── docker-compose.offline.yml
├── package.json             # workspaces: ["apps/*", "packages/*"]
└── .env.example
```

### 3.5 Papel de cada app

| App | Público | Responsabilidade | Protótipo |
|---|---|---|---|
| **`@cac/api`** | Clientes HTTP | Auth, RBAC, CRUD, search/match, conexões, curadoria, upload, e-mail, jobs | — |
| **`@cac/www`** | Visitante, SEO, demo externa | Home (**5 caminhos**), busca + facets, resultados com match inline, product-page, projeto, perfil org, **financiamento (2 abas)**, **casos de sucesso**, **chatbot** | v13 |
| **`@cac/web`** | Usuário logado, curador, admin | Login/register, dashboard, wizards (solução, desafio, oferta de financiamento, caso), conexões, **representação**, org settings, admin | v9 |

> **Admin na entrega:** rotas `/admin/*` dentro de `@cac/web` com guard `ADMIN|CURADOR`. App admin separado = P2.

### 3.6 Camadas internas da `@cac/api`

```
HTTP Request
    → middleware (auth, rateLimit, validate Zod)
    → routes.ts          # contrato HTTP
    → service.ts         # regras + orquestração entre entidades
    → prisma             # persistência
    → response DTO       # nunca expor model Prisma cru
```

| Módulo | Entidades relacionadas | Exemplo de agregação |
|---|---|---|
| `organizations` | User ↔ OrgMember ↔ Organization | POST `/organizations/:id/members` |
| `technologies` | Org → Technology → Tags → Media | GET `/technologies/:slug` agrega org + tags + projetos |
| `challenges` | Org → Challenge → Tags → NeedTypes | POST `/challenges` dispara reindex embedding |
| `projects` | Org → Project (project/initiative/policy/programme) | GET `/projects` entra no índice de busca |
| `funding` | Org → FundingOffer (ativa) · FunderProfile (diretório) | GET `/funding-offers?active=true` filtra por prazo vigente |
| `cases` | Org → SuccessCase → Media → Needs | POST `/success-cases/:id/submit` entra na fila de curadoria |
| `search` | Technology, Challenge, Org, FunderProfile, FundingOffer, Project, SuccessCase | POST `/search` retorna **agregado ranqueado + facets + 3 caminhos** |
| `connections` | Org → Connection → `targetType`/`targetId` | POST `/connections` + notificação |
| `representation` | User ↔ OrgRepresentationRequest ↔ Organization | POST `/organizations/:id/representation-requests` |
| `i18n` | ContentTranslation por entidade/campo | GET `?lang=en` resolve tradução com fallback PT |
| `chat` | Reusa `search` | POST `/chat/message` → interpretação + agregado |
| `admin` | Curadoria cross-entity + domínios | GET `/admin/pending` unifica IN_REVIEW de solução, desafio, caso e oferta |

> **Não existe módulo `match`.** O cálculo de score e os 3 caminhos vivem dentro de `search`, porque o match é o retorno da busca. Manter `POST /api/match/challenge/:id` apenas como atalho que reusa o mesmo serviço.

**Exemplo DTO product-page** (www consome, api monta):

```typescript
// GET /api/technologies/:slug
{
  technology: { title, problemStatement, howItWorks, trl, ... },
  organization: { name, slug, verified },
  relatedProjects: [...],
  relatedFunders: [...],
  matchPreview?: { score, factors }  // se ?challengeId=
}
```

### 3.7 Autenticação cross-app (www ↔ web)

```
1. Usuário em www clica "Tenho interesse"
2. Redirect → app.web/login?returnUrl=/connections/new?technologyId=...
3. web faz POST /api/auth/login
4. API seta refresh em httpOnly cookie (domain=.climateactionconnect.org)
   access token (15 min) em memória do SPA
5. web abre fluxo conexão → POST /api/connections
6. Opcional: redirect de volta para www/technologies/:slug?connected=1
```

| Config | Valor |
|---|---|
| CORS origins | `http://localhost:5179`, `http://localhost:5178` (+ staging/prod) |
| Cookie domain (prod) | `.climateactionconnect.org` |
| `@cac/shared` | tipos `User`, `UserRole`, payloads auth |

### 3.8 Pacote `@cac/shared`

```
packages/shared/src/
├── schemas/          # Zod — bodies/responses
│   ├── technology.ts
│   ├── challenge.ts
│   ├── search.ts
│   └── connection.ts
├── enums/            # ContentStatus, ConnectionStatus, ...
└── constants/        # MATCH_MIN_SCORE default, etc.
```

- **api** importa schemas para validação de request/response
- **www/web** importam tipos inferidos (`z.infer<>`)
- Relações documentadas no schema, não espalhadas nos frontends

### 3.9 Fluxo assíncrono — indexação

```
Technology/Challenge publicado ou editado (campos textuais)
        │
        ▼
  Redis queue: `embedding:index`
        │
        ▼
  Worker (boot da api ou container api-worker)
        │
        ├── EmbeddingProvider.embed(text)
        └── UPSERT TechnologyEmbedding / ChallengeEmbedding
```

### 3.10 Diagrama de dependências (semanas)

```mermaid
flowchart LR
  S0[S1 Scaffold<br/>api+www+web+shared] --> S1[S2 Cadastros API]
  S1 --> S2[S3 www público<br/>web auth]
  S2 --> S3[S4 Search + Match]
  S3 --> S4[S5 Conexões + Admin]
  S4 --> S5[S6 Seed + Staging]
  S5 --> DEMO[15/10 Demo]
```

---

## 4. Stack e decisões técnicas (travadas)

| Decisão | Escolha (produção) | Motivo |
|---|---|---|
| Runtime | Node.js ≥ 20 LTS | Padrão EJC |
| API | Express 5 + TypeScript | Padrão EJC |
| ORM / DB | Prisma 6 + MySQL 8 | Padrão EJC; índices compostos nas entidades buscáveis |
| Cache/fila | Redis 7 (ioredis) | Indexação, rate limit, jobs |
| Worker | Container `api-worker` separado | Embeddings e e-mail fora do request path |
| Validação | Zod via `@cac/shared` | Contratos únicos |
| Auth | JWT access (15m) + refresh (7d) em cookie httpOnly | Cross-app www/web |
| Upload | Multer → `uploads/` (só api) + validação MIME/tamanho | Product-page e evidências |
| E-mail | Nodemailer + SMTP env (só api) | Conexões; fila Redis |
| Frontend | React 19 + Vite 7 + React Router 7 | Padrão EJC |
| UI kit | `@cac/ui` desde S1 (tokens do v13) | Evita divergência www/web |
| Estilo | Tailwind **ou** CSS modules — **escolher 1 na S1 e travar** | Consistência com protótipo |
| Testes | Vitest + supertest (API) + smoke E2E da jornada demo | Auth, match, connections |
| Embeddings | OpenAI API via `EmbeddingProvider` | Interface trocável |
| Vetores | Tabela `*Embedding` com vetor JSON + **índice de pré-filtro SQL**; caminho de upgrade documentado para store vetorial dedicado | Produção sem atalho que force rewrite |
| Similaridade | Cosine in-process até ~10k itens; batch + cache Redis de query embedding | Escala do catálogo institucional |
| i18n | Catálogo de strings + `ContentTranslation` desde S1 | EN no Marco 2 sem refactor |
| Observabilidade | Logs JSON, `/health`, `/ready`, request-id | Operação de staging/prod |
| Backup | Dump MySQL agendado no staging/prod | Demo e offline |

### 4.1 Variáveis de ambiente (mínimo)

```env
# Database (só api)
DATABASE_URL=mysql://cac:cac_secret@localhost:3308/cac

# Redis (só api)
REDIS_URL=redis://localhost:6381

# API
API_PORT=3003
JWT_SECRET=
JWT_REFRESH_SECRET=
CORS_ORIGIN=http://localhost:5178,http://localhost:5179
COOKIE_DOMAIN=localhost

# Frontends
WWW_URL=http://localhost:5179
WEB_URL=http://localhost:5178
VITE_API_URL=http://localhost:3003

# IA (só api)
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=
EMBEDDING_MODEL=text-embedding-3-small
MATCH_MIN_SCORE=60

# Upload / Mail (só api)
UPLOAD_DIR=uploads
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM_EMAIL=noreply@climateactionconnect.org

# App
CONNECTION_EXPIRY_DAYS=15
NODE_ENV=development

# Marca substituível (validação 02/09/2026 — nome e logo podem mudar)
APP_BRAND_NAME="Climate Action Connect"
APP_BRAND_SHORT="CAC"
APP_BRAND_LOGO=/assets/brand/logo.svg

# Idiomas
DEFAULT_LANG=pt
SUPPORTED_LANGS=pt,en
TRANSLATION_PROVIDER=            # vazio = tradução manual via ContentTranslation

# Pesos do score (não travar no código — pendente de homologação técnica)
SCORE_WEIGHTS=semantic:40,tags:25,region:15,maturity:10,need:10

# Modo offline (Bloco B)
OFFLINE_MODE=false               # true = sem chamadas externas, embeddings do seed
```

---

## 5. Modelo de dados — implementação

Implementar schema completo de `requisitos.md` §13. **Somente `@cac/api` contém Prisma.**

### 5.1 Migration v1 (Semana 1 — dia 3)

`User`, `Organization`, `OrganizationMember`, `Domain`, enums base.

### 5.2 Migration v2 (Semana 2)

`Technology`, `TechnologyMedia`, `TechnologyTag`, `Challenge`, `ChallengeTag`, `OrgRepresentationRequest`.

### 5.3 Migration v3 (Semana 3)

`TechnologyEmbedding`, `ChallengeEmbedding`, `FunderProfile`, `Project` (com `type`), `ProjectEmbedding`.

### 5.4 Migration v4 (Semana 4)

`Connection` (`targetType` + `targetId`), `MatchEvent`, `MatchFeedback`, `SavedItem`, `Follow`, `AuditLog`.

### 5.4.1 Migration v5 (Semana 6) — novo na v2.0

`FundingOffer`, `SuccessCase`, `SuccessCaseMedia`, `SuccessCaseNeed`, `SuccessCaseEmbedding`.

### 5.4.2 Migration v6 (Bloco B) — novo na v2.0

`ContentTranslation` (`entityType`, `entityId`, `field`, `lang`, `value`), `ChatSession`, `ChatMessage`.

### 5.5 Enums críticos

```prisma
enum UserRole { ADMIN CURADOR ORG_ADMIN ORG_MEMBER }
enum ContentStatus { DRAFT IN_REVIEW PUBLISHED ARCHIVED }
enum Visibility { PUBLIC RESTRICTED ON_REQUEST }
enum ConnectionObjective { KNOW_MORE IMPLEMENT_SOLUTION PARTNERSHIP FUNDING }
enum ConnectionTargetType { TECHNOLOGY PROJECT FUNDING_OFFER SUCCESS_CASE CHALLENGE ORGANIZATION }
enum ConnectionStatus { PENDING ACCEPTED DECLINED EXPIRED CONTACT_SHARED CLOSED }
enum OrgVerificationStatus { PENDING VERIFIED REJECTED }
enum RepresentationStatus { REQUESTED UNDER_REVIEW APPROVED REJECTED }
enum ClimateAction { ADAPTATION MITIGATION BOTH }
enum ProjectType { PROJECT INITIATIVE POLICY PROGRAMME }
enum ContentType { SOLUTION PROJECT INITIATIVE POLICY PROGRAMME ORGANIZATION FUNDER SUCCESS_CASE }
enum Maturity { RESEARCH VALIDATION DEMONSTRATION READY_FOR_IMPLEMENTATION AT_SCALE }
enum NeedType { TECHNOLOGY KNOWLEDGE PARTNERSHIP FUNDING TRAINING RESEARCH EQUIPMENT }
enum FundingOfferStatus { DRAFT ACTIVE EXPIRED ARCHIVED }
enum Lang { PT EN }
```

> **`ConnectionType` foi substituído** por `ConnectionObjective` + `ConnectionTargetType`. O tipo antigo misturava *objetivo* e *alvo*; a validação exige que a conexão aponte para um **item concreto** com um **objetivo declarado**.

### 5.6 Índices obrigatórios

| Tabela | Índice |
|---|---|
| `Technology` | `slug` UNIQUE, `status`, `organizationId` |
| `Challenge` | `status`, `organizationId` |
| `Project` | `slug` UNIQUE, `type`, `status` |
| `FundingOffer` | `status`, `deadline`, `organizationId` |
| `SuccessCase` | `slug` UNIQUE, `status`, `country` |
| `Organization` | `slug` UNIQUE, `verificationStatus` |
| `Connection` | `requesterOrgId`, `targetOrgId`, `status`, `(targetType, targetId)` |
| `OrgRepresentationRequest` | `(userId, organizationId)` UNIQUE, `status` |
| `ContentTranslation` | `(entityType, entityId, field, lang)` UNIQUE |
| `Domain` | `(grouping, key)` UNIQUE |

---

## 6. API — contratos e prioridade

Legenda: **S1** = Semana 1 … **S6** = Semana 6.  
**Consumidores:** www = leitura/descoberta · web = escrita/autenticado · ambos = search.

### 6.1 Auth — S1

| Método | Rota | P0 | Consumidor |
|---|---|---|---|
| POST | `/api/auth/register` | ✅ | web |
| POST | `/api/auth/login` | ✅ | web |
| POST | `/api/auth/refresh` | ✅ | web |
| POST | `/api/auth/logout` | ✅ | web |
| GET | `/api/auth/me` | ✅ | web |
| POST | `/api/auth/forgot-password` | P1 | web |
| POST | `/api/auth/reset-password` | P1 | web |

### 6.2 Domains — S1

| GET | `/api/domains/:grouping` | ✅ | www, web |
| POST/PATCH/DELETE | `/api/admin/domains` — CRUD de taxonomias, **incluindo `country` e `region`** | ✅ | web (admin) |

### 6.3 Organizations — S2

| GET | `/api/organizations` | ✅ | www |
| GET | `/api/organizations/:slug` | ✅ | www |
| POST/PATCH | `/api/organizations` | ✅ | web |
| POST | `/api/organizations/:id/members` | ✅ | web |

### 6.4 Technologies — S2–S3

| GET | `/api/technologies` | ✅ | www |
| GET | `/api/technologies/:slug` | ✅ | www (DTO agregado) |
| POST/PATCH | `/api/technologies` | ✅ | web |
| POST | `/api/technologies/:id/submit` | ✅ | web |
| POST | `/api/technologies/:id/publish` | ✅ | web (CURADOR/ADMIN) |
| POST | `/api/technologies/:id/media` | ✅ | web |

### 6.5 Challenges — S2–S3

| GET | `/api/challenges`, `/:id` | ✅ | www (público) |
| POST/PATCH | `/api/challenges` | ✅ | web |

### 6.6 Search (inclui o match) — S4

| Método | Rota | P0 | Consumidor |
|---|---|---|---|
| POST | `/api/search` | ✅ | www, web, chat |
| POST | `/api/match/challenge/:id` | ✅ | www, web (atalho que reusa `search`) |
| POST | `/api/match/technology/:id` | P1 | web |
| POST | `/api/match/feedback` | P1 | www |

**Contrato de resposta de `POST /api/search`** — reflete diretamente o protótipo v13:

```typescript
{
  interpretation: {              // callout "Interpretação demonstrativa"
    challenge: string, context: string, sector: string, intent: string
  },
  total: number,                 // 128
  facets: {                      // composição do resultado
    solutions: number,           // 48
    projects: number,            // 28
    organizations: number,       // 30
    funders: number              // 22
  },
  results: Array<{
    id, contentType, title, summary, tags: string[],
    score: number,               // 0–100
    factors: Array<{ label: string, weight: number, value: number }>
  }>,
  paths: {                       // os 3 caminhos do match
    whoCanSolve:  Array<{ organizationId, name, score }>,
    whoCanFund:   Array<{ id, kind: 'ACTIVE_OFFER' | 'DIRECTORY', name, score }>,
    relatedProjects: Array<{ id, type, title, score }>
  }
}
```

> `paths` **nunca** inclui `whoCanImplement`. Decisão de negócio de 02/09/2026.

### 6.7 Connections — S5

| Método | Rota | P0 | Consumidor |
|---|---|---|---|
| POST | `/api/connections` (exige `targetType`, `targetId`, `objective`) | ✅ | web |
| GET | `/api/connections` | ✅ | web |
| PATCH | `/api/connections/:id/accept` · `/decline` · `/close` | ✅ | web |
| POST/DELETE | `/api/saved-items` · `/api/follows` | ✅ | web |

### 6.8 Funding — S6

| Método | Rota | P0 | Consumidor |
|---|---|---|---|
| GET | `/api/funding-offers?active=true` | ✅ | www |
| GET | `/api/funding-offers/:id` | ✅ | www |
| POST/PATCH | `/api/funding-offers` | ✅ | web (auto-cadastro da instituição) |
| GET | `/api/funders`, `/api/funders/:id` | ✅ | www |
| POST/PATCH | `/api/funders` | ✅ | web |

### 6.9 Projects & Success Cases — S3 / S6

| Método | Rota | P0 | Consumidor |
|---|---|---|---|
| GET | `/api/projects`, `/api/projects/:slug` | ✅ | www |
| POST/PATCH | `/api/projects` | ✅ | web |
| GET | `/api/success-cases`, `/api/success-cases/:slug` | ✅ | www |
| POST/PATCH | `/api/success-cases` | ✅ | web |
| POST | `/api/success-cases/:id/media` · `/submit` · `/publish` | ✅ | web |

### 6.10 Representação institucional — S2

| Método | Rota | P0 | Consumidor |
|---|---|---|---|
| POST | `/api/organizations/:id/representation-requests` | ✅ | web |
| GET | `/api/admin/representation-requests` | ✅ | web (admin) |
| POST | `/api/admin/representation-requests/:id/approve` · `/reject` | ✅ | web (admin) |

### 6.11 Admin — S5–S6

| Método | Rota | P0 | Consumidor |
|---|---|---|---|
| GET | `/api/admin/dashboard` (KPIs) | ✅ | web |
| GET | `/api/admin/pending` (unifica IN_REVIEW cross-entity) | ✅ | web |
| POST | `/api/admin/organizations/:id/verify` | ✅ | web |
| POST/PATCH/DELETE | `/api/admin/domains` (inclui países e regiões) | ✅ | web |
| POST | `/api/admin/import/technologies` | P1 | web |

### 6.12 Chat — Bloco B

| Método | Rota | P0 | Consumidor |
|---|---|---|---|
| POST | `/api/chat/message` | P0-B | www |

Interpreta o relato, chama o **mesmo serviço de `search`** e devolve `{ reply, interpretation, paths, results }`.

### 6.13 Health — S1

| GET | `/health` | ✅ | infra |

---

## 7. Frontends — `@cac/www` e `@cac/web`

Alinhar visual ao **site navegável v13**. Tokens extraídos do protótipo:

```css
--navy:#0a2440;  --navy2:#12364e;  --green:#13865a;  --green2:#2cab77;  --green3:#dff3e9;
--bg:#f7faf8;    --cream:#f5f3ea;  --ink:#24353e;    --muted:#6e7b82;   --line:#dce5e6;
--gold:#d59c28;  --blue:#2d6e9f;   --shadow:0 14px 38px rgba(10,36,64,.10);
/* fonte base Inter/Segoe UI; piso de legibilidade 11px; cards raio 16px */
```

Breakpoints do protótipo: `≤980px` (tablet) e `≤620px` (celular, com nav inferior fixa).

### 7.1 Mapa protótipo → app → rota

| Seção do protótipo v13 | App | Rota | Sprint |
|---|---|---|---|
| Hero + banner + busca | **www** | `/` | S3 |
| **5 caminhos** (`.entry-grid`) | **www** | cards na Home | S3 |
| `#explorar` Busca principal + 8 filtros | **www** | `/search` | S3–S4 |
| Resultados + score + `.metric-row` (facets) | **www** | `/search?q=…` | S4 |
| `#solutionDetail` Product-page + "Por que 94%?" | **www** | `/technologies/:slug` | S3–S4 |
| "Caminhos produzidos pela busca" (3 caminhos) | **www** | painel inline em `/search` | S4 |
| `#financiamento` abas oferta ativa / diretório | **www** | `/funding` | S6 |
| `#casos` Casos de sucesso | **www** | `/cases`, `/cases/:slug` | S6 |
| `#desafio` Publicar um desafio | **web** | `/demand/new` | S3 |
| `#oferta` O que você oferece | **web** | `/offer/new` | S3 |
| `#perfil` Fluxo de representação (5 passos) | **web** | `/org/representation` | S2–S3 |
| Publicar oferta de financiamento | **web** | `/funding-offers/new` | S6 |
| Submeter caso de sucesso | **web** | `/cases/new` | S6 |
| Projeto / iniciativa / política | **www** | `/projects/:slug` | S3 |
| Perfil org público | **www** | `/organizations/:slug` | S3 |
| Detalhe desafio | **www** | `/challenges/:id` | S3 |
| Conexão (modal "Solicitar conexão") | **web** | `/connections/new?type=…&id=…` | S5 |
| Dashboard | **web** | `/dashboard` | S5 |
| Minhas conexões / salvos / seguindo | **web** | `/my/connections`, `/my/saved`, `/my/follows` | S5 |
| Admin curadoria | **web** | `/admin/curate` | S5 |
| Admin KPIs | **web** | `/admin/dashboard` | S5 |
| Admin domínios (países/regiões) | **web** | `/admin/domains` | S5 |
| Admin representação | **web** | `/admin/representation` | S5 |
| `#local` Converse com a CAC | **www** | `/chat` | Bloco B |

### 7.1.1 Navegação (obrigatória)

```
navlinks (público):  Buscar · Financiamento · Desafio · Ofereça · Casos
nav-actions:         Entrar · Criar conta
mobile-nav (≤620px): Início · Buscar · Desafio · Casos
```

**O Perfil não entra em `navlinks`.** Após o login, conta/perfil aparecem de forma contextual na barra de ações.

### 7.2 `@cac/www` — Portal público

```
apps/www/src/
├── main.tsx
├── app/
│   ├── router.tsx
│   ├── layout/
│   │   └── PublicLayout.tsx       # header sticky, nav sem Perfil, mobile-nav
│   ├── pages/
│   │   ├── HomePage.tsx            # banner + busca + 5 caminhos
│   │   ├── SearchPage.tsx          # filtros + resultados + facets + 3 caminhos
│   │   ├── TechnologyPage.tsx
│   │   ├── ProjectPage.tsx         # project | initiative | policy | programme
│   │   ├── FundingPage.tsx         # abas: ofertas ativas | diretório
│   │   ├── CasesPage.tsx           # vitrine
│   │   ├── CaseDetailPage.tsx      # evidências + necessidades
│   │   ├── OrganizationPage.tsx
│   │   ├── ChallengePage.tsx
│   │   └── ChatPage.tsx            # Bloco B
│   ├── components/
│   │   ├── SearchBar.tsx
│   │   ├── FilterPanel.tsx         # 8 filtros
│   │   ├── InterpretationCallout.tsx
│   │   ├── ResultCard.tsx
│   │   ├── ResultFacets.tsx        # 128 / 48 / 28 / 30 / 22
│   │   ├── ScoreBadge.tsx
│   │   ├── ScoreExplanation.tsx    # "Por que 94%?"
│   │   ├── MatchPaths.tsx          # quem resolve · quem financia · projetos
│   │   ├── FundingTabs.tsx
│   │   ├── ItemActions.tsx         # interesse · seguir · favoritar · conexão
│   │   └── EntryPaths.tsx          # os 5 caminhos
│   ├── i18n/                       # catálogo PT/EN — nenhuma string hardcoded
│   ├── api/                       # thin client → VITE_API_URL
│   └── styles/
└── assets/
```

| Comportamento | Detalhe |
|---|---|
| Busca, filtros, detalhes e casos | **Abertos, sem login** |
| Perfil no menu | **Não existe** — só ações de conta na barra |
| **"Tenho interesse" / "Solicitar conexão"** | Redirect → `WEB_URL/login?returnUrl=/connections/new?targetType=…&targetId=…` |
| **"Publicar um desafio"** | Redirect → `WEB_URL/demand/new` (login primeiro) |
| **"Publicar oferta de financiamento"** | Redirect → `WEB_URL/funding-offers/new` |
| **"Favoritar / Seguir"** | Requer login; preserva o item no `returnUrl` |
| Tela de match | **Não existe.** O match é renderizado dentro de `/search` e do detalhe |
| API | Somente GET públicos + POST `/api/search` + POST `/api/chat/message` |

### 7.3 `@cac/web` — Painel autenticado + admin

```
apps/web/src/
├── main.tsx
├── app/
│   ├── router.tsx
│   ├── layout/
│   │   ├── AuthLayout.tsx
│   │   ├── AppLayout.tsx          # sidebar área logada
│   │   └── AdminLayout.tsx
│   ├── pages/
│   │   ├── auth/                  # login, register
│   │   ├── dashboard/
│   │   ├── offer/                 # publicar e divulgar uma solução
│   │   ├── demand/                # publicar um desafio
│   │   ├── funding-offers/        # publicar oferta ativa
│   │   ├── cases/                 # submeter caso de sucesso
│   │   ├── connections/
│   │   ├── org/                   # settings + representation
│   │   └── admin/                 # curate, dashboard, domains, representation
│   ├── components/
│   │   ├── ConnectionForm.tsx
│   │   └── guards/                # RequireAuth, RequireRole
│   ├── api/
│   └── styles/
└── assets/
```

| Área | Rotas | API |
|---|---|---|
| Auth | `/login`, `/register` | `/api/auth/*` |
| Operação | `/dashboard`, `/my/*`, `/offer/new`, `/demand/new`, `/funding-offers/new`, `/cases/new` | CRUD autenticado |
| Conexões | `/connections/new`, `/my/connections`, `/my/saved`, `/my/follows` | `/api/connections`, `/api/saved-items`, `/api/follows` |
| Organização | `/org/settings`, `/org/representation` | `/api/organizations/*` |
| Admin | `/admin/dashboard`, `/admin/curate`, `/admin/domains`, `/admin/representation` | `/api/admin/*` |

### 7.4 Componentes críticos da demo

| Componente | App | Comportamento |
|---|---|---|
| `SearchBar` | www | *"O que você está procurando?"* + exemplos clicáveis (hero e `/search` sincronizados) |
| `FilterPanel` | www | 8 filtros combináveis, domínios vindos da API |
| `InterpretationCallout` | www | Mostra desafio · contexto · setor · intenção |
| `ResultCard` | www | Título, tags, score %, botão Abrir |
| `ResultFacets` | www | Composição do resultado por tipo de conteúdo |
| `ScoreExplanation` | www | *"Por que 94%?"* com os fatores; obrigatório mesmo em fallback keyword |
| `MatchPaths` | www | Os 3 caminhos — **sem** "quem pode implementar" |
| `FundingTabs` | www | Alternância oferta ativa / diretório + aviso do diretório |
| `ItemActions` | www | Interesse · seguir · favoritar · solicitar conexão, sempre com `targetType`/`targetId` |
| `EntryPaths` | www | Os 5 caminhos da Home |
| `ConnectionForm` | web | Objetivo (conhecer/implementar/parceria/financiamento) + contexto + enviar |
| `RepresentationWizard` | web | 5 passos: conta → vínculo → solicitar → validar → permissões |
| `CaseForm` | web | Contexto, evidências (upload múltiplo), necessidades |
| `FundingOfferForm` | web | Prazo, o que financia, valor/faixa, critérios, link oficial |
| `ProductPage` | www | Seções §10 de `requisitos.md` + informações complementares + CTAs |
| `LangSwitch` | www/web | PT/EN preservando rota (Bloco B) |

---

## 8. Motor de busca e match (produção)

### 8.1 Pipeline (implementação — só api)

```
POST /api/search { query, filters }
        │
        ├─► 1. Normalizar query (trim, lowercase, detect lang)
        ├─► 2. Extrair interpretação (desafio · contexto · setor · intenção) → devolvida na resposta
        ├─► 3. Filtro SQL sobre TODAS as entidades buscáveis:
        │        Technology · Project(type) · Organization · FunderProfile
        │        FundingOffer(ACTIVE) · SuccessCase · Challenge
        │        (Domain tags, country, region, climateAction, maturity, scale, status=PUBLISHED)
        ├─► 4. Busca keyword (FULLTEXT / LIKE indexado) — sempre disponível
        ├─► 5. Cache Redis do embedding da query (TTL curto)
        ├─► 6. Se embedding disponível: cosine sim query ↔ items (pré-filtrados)
        ├─► 7. Score composto + explicabilidade → ranquear → MIN_SCORE
        ├─► 8. Agregar facets por content_type (total, soluções, projetos, orgs, financiadores)
        └─► 9. Montar os 3 caminhos: whoCanSolve · whoCanFund · relatedProjects
```

> **Escopo fechado:** nenhuma fonte externa. Só o que está conectado à plataforma.
>
> **Produção:** o pipeline é o mesmo em staging, prod e offline. Offline usa embeddings pré-calculados + `KeywordFallbackProvider` — sem segundo motor.

### 8.2 Score v1 (proposta — pesos configuráveis)

| Fator | Peso default | Implementação |
|---|---|---|
| Similaridade semântica | 40% | Cosine embedding query vs. item |
| Tags taxonômicas (tema, setor) | 25% | Jaccard tags filtro ∩ tags item |
| Região/escala | 15% | Match country/region/scale ou neutro 0.5 |
| Maturidade | 10% | Proximidade do nível se filtro informado |
| Necessidade × oferta | 10% | Match `need_type` ↔ `offer_type` |

**Exibição (www):** arredondar 0–100%. Ocultar < `MATCH_MIN_SCORE` (default 60).

> **Atenção — não travar os pesos no código.** A validação de 02/09/2026 registrou que *"a fórmula e os pesos exatos ainda precisam ser definidos tecnicamente"*. Implementar os pesos como **configuração** (`SCORE_WEIGHTS` em env ou tabela `Domain`), para que o ajuste não exija deploy.
>
> O que é **obrigatório**: `factors[]` sempre presente na resposta, permitindo o painel *"Por que 94%?"*.

### 8.2.1 Os 3 caminhos — regra de montagem

| Caminho | Fonte | Regra |
|---|---|---|
| `whoCanSolve` | Organizações donas das soluções/tecnologias no resultado | Quem **gera ou oferece** a solução |
| `whoCanFund` | `FundingOffer` ativa (prioridade) + `FunderProfile` compatível | Marcar `kind` para a UI distinguir oferta ativa de diretório |
| `relatedProjects` | `Project` de qualquer `type` no contexto | Projetos, políticas, iniciativas e programas |

**Proibido:** gerar `whoCanImplement`. Se a informação existir, ela é **declarada pelo conteúdo**, exibida no detalhe, e nunca inferida.

### 8.3 Fallback cold start

Se `OPENAI_API_KEY` ausente, `OFFLINE_MODE=true` ou fila vazia: **keyword + tags + factors[]**. Demo e offline **nunca** dependem de API externa ao vivo.

### 8.4 Interface `EmbeddingProvider` (api)

```typescript
interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}
// OpenAIEmbeddingProvider | KeywordFallbackProvider
```

---

## 9. Infraestrutura e deploy

### 9.1 Docker Compose (dev)

Serviços: `mysql`, `redis`, `api`, `api-worker`, `www`, `web`. Volumes: `mysql_data`, `uploads`.

```yaml
# resumo
services:
  mysql: ...
  redis: ...
  api:        ports: ["3003:3003"]
  api-worker: # embeddings + mail queue
  www:        ports: ["5179:5179"]  # VITE_API_URL=http://api:3003
  web:        ports: ["5178:5178"]
```

### 9.2 Docker Compose (prod/staging)

+ `nginx` reverse proxy com roteamento §3.3, `.env.prod`, `prisma migrate deploy` no entrypoint da API.

**Hospedagem (v2.1):** manter **staging** acessível durante todo o período da demonstração e **prod** espelhada para estabilidade. Domínio, TLS, healthchecks, backup MySQL e monitoramento básico entram no Marco 1.

| Ambiente | Uso |
|---|---|
| `dev` | Desenvolvimento local |
| `staging` | Demo contínua / ensaio |
| `prod` | Apresentação e operação estável |
| `offline` | Cópia local sem internet |

### 9.2.1 Versão local/offline (Bloco B)

Requisito explícito da validação: uma **cópia local/offline** operável sem internet.

| Item | Definição |
|---|---|
| Formato | `docker-compose.offline.yml` — mesmos serviços, sem dependência de rede externa |
| Dados | Dump MySQL com o seed curado + **embeddings pré-calculados** |
| IA | `OFFLINE_MODE=true` → `KeywordFallbackProvider`, sem chamadas à OpenAI |
| Mídia | `uploads/` empacotado junto (evidências dos casos) |
| Chatbot | Interpretação local por regras/embeddings do seed |
| Entrega | Pasta ou imagem `.tar` + **runbook** de execução em 1 comando |
| Verificação | Checklist de paridade: busca, filtros, score, detalhe, casos, financiamento |

**Decisão de arquitetura:** manter a cópia offline como o **mesmo build** com configuração diferente. Não criar um segundo produto estático — isso dobraria a manutenção nas semanas finais.

### 9.3 CI (mínimo de produção)

1. `npm ci`
2. `npm run lint` (api, www, web, shared, ui)
3. `npm run test` (api)
4. `docker compose build`
5. Smoke: `/health` + busca âncora *"recuperação de pastagens em seca"*

### 9.4 Seed demo Embrapa (S6)

Script `scripts/seed.ts` (executado via api):

Volumes definidos na validação de 02/09/2026 — *provar valor sem depender de milhares de registros*:

| Conteúdo | Volume | Observação |
|---|---|---|
| Admin + curador | 1 + 1 | |
| Organizações verificadas | seleção curada | Embrapa, parceiro ICT, governo exemplo, universidade |
| Soluções publicadas | **10–15** | recuperação de pastagens, ILPF, bioinsumos, conservação de água e solo |
| Projetos / iniciativas / políticas | **5–10** | pelo menos um de cada `ProjectType` |
| Desafios | **5–8** | ancorados nos países/contextos abaixo |
| Financiadores | **5–10** | mix de **ofertas ativas** e **diretório** |
| Países / contextos demandantes | **3–5** | Brasil + Moçambique + 1–3 outros |
| Casos de sucesso | ≥3 | incluindo o caso de referência (Moçambique · captação de água de chuva) |
| Embeddings | pré-calculados | demo e offline sem OpenAI ao vivo |

**Cenário-âncora da demo:** a busca *"recuperação de pastagens em seca"* precisa retornar a composição apresentada na reunião — solução em destaque a **94%**, seguida de **89%** e **83%**, com projetos, organizações e financiadores relacionados.

> O seed é **entregável**, não script auxiliar: sem ele a hipótese da demonstração não se sustenta.

---

## 10. Calendário de implementação

**Bloco A:** 02/09 → 15/10 · **Bloco B:** 16/10 → novembro

### Visão geral — Bloco A (núcleo navegável)

| Semana | Período | Foco | Marco (sexta) |
|---|---|---|---|
| **S1** | 02/09 – 06/09 | Scaffold api + www + web + shared + **ui** + **worker**; **i18n e branding desde o início** | 3 apps sobem; login cross-app; health OK |
| **S2** | 09/09 – 13/09 | API cadastros + **representação institucional** + web auth | CRUD via API; representação E2E |
| **S3** | 16/09 – 20/09 | www público (**5 caminhos**) + projetos/iniciativas + web wizards | Portal navegável |
| **S4** | 23/09 – 27/09 | Search + score + **facets** + **3 caminhos** | Busca com score e composição na UI |
| **S5** | 30/09 – 04/10 | Connections (item-based) + salvos/seguir + admin | Fluxo conexão E2E + curadoria |
| **S6** | 07/10 – 11/10 | **Casos de sucesso** + **financiamento (oferta ativa × diretório)** | 5 caminhos completos |
| **Fechamento** | 13/10 – 14/10 | Seed curado, nginx, hospedagem, ajustes, ensaio | Checklist §14.1 verde |
| **Marco 1** | **15/10** | **Entrega formal + demonstração** do núcleo hospedado | — |

### Visão geral — Bloco B (apresentação)

| Semana | Período | Foco | Marco |
|---|---|---|---|
| **S7** | 16/10 – 24/10 | i18n completo: catálogo EN + `ContentTranslation` + `LangSwitch` | Portal navegável em inglês |
| **S8** | 27/10 – 07/11 | Chatbot CAC (`/api/chat/message` + seção "Converse com a CAC") | Chatbot responde sobre a base |
| **S9** | 10/11 – 14/11 | Versão local/offline + runbook + marca configurável | Cópia offline validada |
| **S10** | semana da apresentação | Revisão profissional dos textos EN, curadoria de conteúdo, ensaio, freeze | Checklist §14.2 verde |
| **Marco 2** | **novembro** | **Apresentação** | — |

> A alocação do Bloco B depende da **data exata de novembro**. Enquanto ela não for confirmada, S9 e S10 permanecem como janelas relativas.

---

### S1 — Scaffold (02/09 – 06/09)

| Dia | Entrega |
|---|---|
| 02/09 | Monorepo workspaces; `@cac/shared` boot; ESLint/Prettier |
| 03/09 | Docker Compose (mysql, redis, api, api-worker, www, web); Prisma migration v1; domains seed |
| 04/09 | Auth API (register/login/refresh/me); RBAC middleware |
| 05/09 | `@cac/www` + `@cac/web` + `@cac/ui` boot; layouts base; **design tokens v13**; **i18n e branding por config**; proxy Vite → API |
| 06/09 | Auth cross-app: login web + cookie; CORS dual origin |
| 06/09 | **Marco S1:** `docker compose up` — 3 apps + api + login ✅ · nenhuma string hardcoded na UI ✅ |

---

### S2 — Cadastros API + web auth (09/09 – 13/09)

| Dia | Entrega |
|---|---|
| 09/09 | Organizations CRUD + members + slug; domains seed com **`country` completo** |
| 10/09 | Technologies CRUD + workflow status |
| 11/09 | Challenges CRUD + tags + `need_type` |
| 12/09 | Upload mídia (api); migration v2; **`OrgRepresentationRequest`**; schemas em `@cac/shared` |
| 13/09 | web: `/register`, `/login`, `/org/representation`; integração auth completa |
| 13/09 | **Marco S2:** CRUD P0 testável via API + representação conta→vínculo→validar→permissões ✅ |

---

### S3 — www portal + web wizards (16/09 – 20/09)

| Dia | Entrega |
|---|---|
| 16/09 | www: Home — banner + busca + **5 caminhos**; nav sem Perfil |
| 17/09 | www: Technology product-page + informações complementares |
| 18/09 | www: Organization + Challenge + **Project (project/initiative/policy/programme)** |
| 19/09 | web: wizards `/offer/new` (publique e divulgue) e `/demand/new` (publique um desafio) |
| 20/09 | www: `ItemActions` → redirect contextual para web; migration v3 |
| 20/09 | **Marco S3:** Portal navegável com os 5 caminhos; wizards salvam rascunho ✅ |

---

### S4 — Search & Match (23/09 – 27/09)

| Dia | Entrega |
|---|---|
| 23/09 | EmbeddingProvider + fila Redis; índice multi-entidade |
| 24/09 | `POST /api/search` keyword + **8 filtros** + `interpretation` |
| 25/09 | Score composto com **pesos por configuração** + `factors[]` + `facets` |
| 26/09 | Montagem dos **3 caminhos** (`whoCanSolve` · `whoCanFund` · `relatedProjects`) |
| 27/09 | www: `SearchPage` + `ResultCard` + `ResultFacets` + `ScoreExplanation` + `MatchPaths` |
| 27/09 | **Marco S4:** *"recuperação de pastagens em seca"* retorna 94/89/83, composição por tipo e os 3 caminhos ✅ |

---

### S5 — Conexões & Admin (30/09 – 04/10)

| Dia | Entrega |
|---|---|
| 30/09 | Connection state machine com `targetType`/`targetId`/`objective`; migration v4 |
| 01/10 | Nodemailer: solicitação, aceite, recusa, lembrete, expiração |
| 02/10 | web: `/connections/new`, `/my/connections`; `SavedItem` + `Follow` |
| 03/10 | web: `/admin/curate` (fila unificada) + `/admin/representation` |
| 04/10 | web: `/admin/dashboard` KPIs + `/admin/domains` (países/regiões editáveis) |
| 04/10 | **Marco S5:** www → web → conexão sobre o item → e-mail → aceite ✅ |

---

### S6 — Casos de sucesso & Financiamento (07/10 – 11/10)

| Dia | Entrega |
|---|---|
| 07/10 | Migration v5: `FundingOffer`, `SuccessCase`, mídia e necessidades |
| 08/10 | API: ofertas ativas (filtro de prazo vigente) + diretório + auto-cadastro |
| 09/10 | API: casos de sucesso com workflow de curadoria + upload de evidências |
| 10/10 | www: `/funding` (2 abas com aviso do diretório) + `/cases` + `/cases/:slug` |
| 11/10 | web: `/funding-offers/new` + `/cases/new`; entrada de ambos no índice de busca |
| 11/10 | **Marco S6:** os 5 caminhos da Home completos e navegáveis ✅ |

---

### Fechamento do Bloco A (13/10 – 14/10)

| Dia | Atividade |
|---|---|
| 13/10 | `scripts/seed.ts` com os volumes de §9.4 + embeddings pré-calculados; testes Vitest |
| 14/10 | nginx + `docker-compose.prod.yml`; **hospedagem publicada**; smoke test §14.1; **freeze do núcleo**; ensaio cronometrado |

---

### Marco 1 — 15/10: entrega formal com demonstração

O 15/10 é **compromisso de entrega ao cliente**, com demonstração ao vivo na data. O checklist §14.1 é **critério de aceite**, não conferência interna: nenhum item vermelho pode ser empurrado para novembro.

Roteiro da demonstração (~20 min):

1. **www** — Home: banner, busca e os 5 caminhos (2 min)
2. **www** — Busca → interpretação, filtros, scores e composição (4 min)
3. **www** — Product-page + *"Por que 94%?"* (3 min)
4. **www** — Os 3 caminhos do match (2 min)
5. **www** — Financiamento: oferta ativa × diretório (2 min)
6. **www** — Caso de sucesso com evidências (2 min)
7. **web** — Publicar um desafio → correspondências (2 min)
8. **www → web** — Interesse no item → identificação → conexão → aceite (3 min)
9. **web/admin** — Curadoria, KPIs e domínios (2 min)

---

### Bloco B — S7: internacionalização (16/10 – 24/10)

| Dia | Entrega |
|---|---|
| 16–17/10 | Migration v6 (`ContentTranslation`); resolução `?lang=` com fallback PT |
| 20–21/10 | Catálogo EN completo de interface (www + web + e-mails) |
| 22/10 | `LangSwitch` preservando rota e filtros |
| 23/10 | Tradução do seed demonstrativo |
| 24/10 | **Marco S7:** portal integralmente navegável em inglês ✅ |

---

### Bloco B — S8: chatbot CAC (27/10 – 07/11)

| Período | Entrega |
|---|---|
| 27–29/10 | `POST /api/chat/message`: interpretação do relato → chamada ao serviço de `search` |
| 30/10 – 03/11 | www: seção "Converse com a CAC" (desktop + mobile) com encaminhamento aos resultados |
| 04–06/11 | Ajuste da interpretação sobre o seed; guardrails (§9.5 de `requisitos.md`) |
| 07/11 | **Marco S8:** relato → caminhos (soluções, projetos, financiamento, conhecimento) ✅ |

---

### Bloco B — S9: versão local/offline (10/11 – 14/11)

| Dia | Entrega |
|---|---|
| 10–11/11 | `docker-compose.offline.yml` + `OFFLINE_MODE=true` + dump com embeddings |
| 12/11 | Empacotamento de `uploads/` e verificação de paridade funcional |
| 13/11 | Runbook de geração e execução; troca de marca por configuração |
| 14/11 | **Marco S9:** cópia offline executada em máquina sem internet ✅ |

---

### Bloco B — S10: ensaio e freeze (semana da apresentação)

| Atividade |
|---|
| Revisão profissional dos textos em inglês |
| Curadoria final do conteúdo demonstrativo |
| Ensaio completo do roteiro (§14.2), em PT e EN |
| Freeze; plano B com a cópia offline caso a rede falhe |

---

## 11. Distribuição por dev (equipe 2)

### Dev A — Backend + api

| Semana | Foco |
|---|---|
| S1 | Scaffold api, shared schemas, Prisma, Docker |
| S2 | Organizations, Technologies, Challenges, upload, **representação** |
| S3 | Projects (4 tipos), agregados de DTO, migration v3 |
| S4 | Search, score configurável, facets, 3 caminhos, embeddings, Redis worker |
| S5 | Connections item-based, e-mail, admin API, CRUD de domínios |
| S6 | **FundingOffer + SuccessCase** (migration v5), curadoria unificada |
| Fechamento | Seed curado, testes API, nginx, hospedagem |
| S7 | `ContentTranslation`, resolução de idioma |
| S8 | `POST /api/chat/message` reusando `search` |
| S9 | Pacote offline, `OFFLINE_MODE`, runbook |

### Dev B — Frontends (www + web)

| Semana | Foco |
|---|---|
| S1 | www + web scaffold, layouts, **tokens v13**, **infra i18n**, branding, CORS test |
| S2 | web auth/register, `RepresentationWizard`; integração API |
| S3 | www Home (5 caminhos), product-page, project, org; web wizards |
| S4 | www Search + `ResultFacets` + `ScoreExplanation` + `MatchPaths` |
| S5 | web connections (item-based), salvos/seguir, admin UI |
| S6 | www `/funding` (2 abas) + `/cases`; web `FundingOfferForm` + `CaseForm` |
| Fechamento | Polish mobile/tablet, redirect contextual, ensaio |
| S7 | Catálogo EN, `LangSwitch`, revisão de layout com textos longos |
| S8 | Seção "Converse com a CAC" (desktop + mobile) |
| S9–S10 | Verificação de paridade offline, ensaio em PT e EN |

**Sync diário:** 15 min · **Review marco:** sexta 16h.

> **Risco de alocação.** O Bloco A tem duas frentes novas no fim (casos de sucesso e financiamento) concorrendo com o fechamento. Se S5 atrasar, o Dev A antecipa a migration v5 e o Dev B usa telas estáticas com dados reais até a API ficar pronta.

---

## 12. Marcos e critérios de done

### Marco S1 (06/09)

- [ ] `docker compose up` — mysql, redis, api, www, web
- [ ] `@cac/shared` importável em api e frontends
- [ ] Register + login (web) retorna JWT + cookie
- [ ] CORS aceita localhost:5178 e :5179
- [ ] `GET /health` → 200
- [ ] **Nenhuma string de UI hardcoded** (tudo no catálogo i18n)
- [ ] Nome e logo vindos de configuração

### Marco S2 (13/09)

- [ ] Technology: rascunho → submit → publish (curador via API)
- [ ] Challenge criado e listado, com `need_type`
- [ ] web login/register funcional
- [ ] **Representação institucional** completa: conta → vínculo → solicitar → validar → permissões
- [ ] Usuário sem representação aprovada **não** consegue publicar em nome da organização
- [ ] `country` populado com a lista completa

### Marco S3 (20/09)

- [ ] www Home com os **5 caminhos**
- [ ] **Perfil ausente** do menu principal; rotas públicas acessíveis sem login
- [ ] www `/technologies/:slug` com mídia e informações complementares
- [ ] www `/projects/:slug` cobrindo os 4 tipos
- [ ] web wizards de solução e desafio salvam rascunho
- [ ] Ações do item redirecionam preservando `targetType`/`targetId`

### Marco S4 (27/09)

- [ ] www busca retorna ≥3 resultados com score ≥60%
- [ ] `ScoreExplanation` visível com ≥3 fatores
- [ ] `ResultFacets` mostra a composição por tipo de conteúdo
- [ ] `MatchPaths` exibe os 3 caminhos — e **nenhum** "quem pode implementar"
- [ ] Pesos do score alteráveis por configuração, sem deploy
- [ ] Busca não consulta nenhuma fonte externa

### Marco S5 (04/10)

- [ ] Fluxo www → web → conexão PENDING → ACCEPTED
- [ ] `Connection` rejeitada pela API se faltar `targetType`, `targetId` ou `objective`
- [ ] E-mail registrado (mailhog ok)
- [ ] Favoritar/salvar e seguir funcionando
- [ ] web admin aprova IN_REVIEW e representações
- [ ] Admin edita países e regiões e a mudança reflete nos filtros

### Marco S6 (11/10)

- [ ] Oferta ativa cadastrada pela própria instituição e listada com prazo vigente
- [ ] Diretório exibe o aviso de que não implica chamada aberta
- [ ] Caso de sucesso publicado com evidências e necessidades
- [ ] Ofertas e casos aparecem nos resultados de busca
- [ ] Os 5 caminhos da Home levam a telas funcionais

### Marco 1 (15/10) — critério de aceite da entrega formal

- [ ] Seed idempotente com os volumes de §9.4
- [ ] nginx roteia www + web + /api
- [ ] ≥10 testes automatizados passando
- [ ] **Ambiente hospedado e acessível**
- [ ] Responsivo em celular, tablet e desktop
- [ ] Checklist §14.1 verde

### Marco S7 (24/10)

- [ ] Portal integralmente navegável em inglês
- [ ] `LangSwitch` preserva rota, query e filtros
- [ ] Seed demonstrativo traduzido
- [ ] Layout íntegro com textos longos em EN

### Marco S8 (07/11)

- [ ] `POST /api/chat/message` devolve `interpretation` + `paths` + `results`
- [ ] Chatbot reusa o **mesmo** serviço de busca (sem índice paralelo)
- [ ] Seção "Converse com a CAC" navegável em desktop e mobile
- [ ] Nenhuma resposta fora da base

### Marco S9 (14/11)

- [ ] Cópia offline executada em máquina **sem internet**
- [ ] Paridade verificada: busca, filtros, score, detalhe, casos, financiamento
- [ ] Runbook validado por alguém que não construiu o pacote

### Marco 2 (novembro)

- [ ] Checklist §14.2 verde
- [ ] Textos EN revisados profissionalmente
- [ ] Ensaio completo em PT e EN

---

## 13. Riscos do cronograma apertado

| Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|
| **Escopo da validação consumiu o buffer** | Alta | Alto | Bloco B separado; P1 só com folga; repriorização semanal |
| **Duas frentes novas em S6** (casos + financiamento) | Alta | Alto | Migration v5 antecipada; UI com dados reais antes da API |
| **i18n retrofit** se deixado para o Bloco B | Alta | Alto | Infra de i18n na S1, mesmo entregando só PT |
| **Chatbot virar escopo aberto** | Alta | Alto | Contrato fixo: interpreta + chama `search`. Sem índice ou modelo próprio |
| **Offline subestimado** | Média | Alto | Mesmo build com `OFFLINE_MODE`; decidir estratégia até o Marco 1 |
| **Data de novembro indefinida** | Alta | Médio | Confirmar com o cliente antes do fim do Bloco A |
| Setup 3 apps atrasa S1 | Média | Alto | shared mínimo S1; www/web esqueleto |
| Auth cross-app quebra | Média | Alto | Cookie localhost; testar redirect dia 6 |
| OpenAI indisponível | Média | Alto | Fallback keyword; embeddings no seed |
| SMTP não configurado | Média | Médio | Mailhog dev/staging |
| 1 dev a menos | Alta | Crítico | Mesclar www+web temporariamente (rollback arquitetura) |
| Duplicação UI www/web | Média | Médio | `@cac/ui` P1; tokens CSS compartilhados S1 |
| Seed pobre esvazia a narrativa | Média | Alto | Seed é entregável com dono e prazo (§9.4) |

### Plano de contingência

**Atraso >2 dias no Bloco A:**

1. Score só keyword + tags (mantendo `factors[]` e a explicação)
2. Admin KPIs por contadores SQL diretos
3. Casos de sucesso sem workflow de curadoria — publicação direta pelo admin
4. Ofertas de financiamento sem auto-cadastro — carga via seed
5. Mesclar www+web em app único **somente se crítico** (último recurso)

**Atraso no Bloco B — ordem de sacrifício:**

1. Export/histórico e demais P1
2. Tradução automática de conteúdo (**mantendo a interface em inglês**)
3. Profundidade da interpretação do chatbot

**Nunca sacrificar:** busca com score explicável · os 5 caminhos · conexão sobre o item · versão local/offline · **fundação** (API única, contratos, i18n, CI, worker, backups).

---

## 14. Checklists de demonstração

### 14.1 Marco 1 — 15/10 (entrega formal, staging/prod hospedado)

- [ ] **www** — Home explica a proposta (banner + busca + **5 caminhos**)
- [ ] **www** — Menu **sem Perfil**; navegação pública sem login
- [ ] **www** — Busca *"recuperação de pastagens em seca"* → **94% / 89% / 83%**
- [ ] **www** — Interpretação exibida (desafio · contexto · setor · intenção)
- [ ] **www** — Os 8 filtros combinam e alteram o resultado
- [ ] **www** — Composição visível: **128 = 48 + 28 + 30 + 22**
- [ ] **www** — Product-page completa + informações complementares
- [ ] **www** — *"Por que 94%?"* com ≥3 fatores
- [ ] **www** — Os 3 caminhos; **nenhuma** menção a "quem pode implementar"
- [ ] **www** — `/funding`: oferta ativa × diretório, com o aviso do diretório
- [ ] **www** — `/cases/:slug` com evidências e necessidades declaradas
- [ ] **www** — Projeto/iniciativa/política aparece nos resultados e abre detalhe
- [ ] **www** — Perfil de organização verificada com soluções vinculadas
- [ ] **www → web** — Interesse no item redireciona, identifica e solicita conexão
- [ ] **web** — Ofertante vê a solicitação em `/my/connections` com objetivo e item
- [ ] **web** — Aceitar conexão → solicitante notificado (e-mail)
- [ ] **web** — Publicar um desafio (seca/produtividade) → correspondências
- [ ] **web** — Instituição publica a própria oferta de financiamento
- [ ] **web** — Fluxo de representação até o selo de verificado
- [ ] **web** — Favoritar/salvar e seguir um item
- [ ] **web/admin** — Fila de curadoria + KPIs + edição de países/regiões
- [ ] Responsivo em celular, tablet e desktop
- [ ] Seed com os volumes de §9.4
- [ ] `docker compose -f docker-compose.prod.yml up` sobe www + web + api + worker
- [ ] `/health` e `/ready` verdes; backup MySQL configurado
- [ ] Testes de auth, score e connections verdes

### 14.2 Marco 2 — novembro (apresentação)

- [ ] Todo o checklist §14.1 verde
- [ ] Alternar para **inglês** e repetir a jornada principal
- [ ] Textos em inglês revisados profissionalmente
- [ ] **Converse com a CAC**: relatar o problema e receber caminhos da base
- [ ] Chatbot navegável em desktop e mobile
- [ ] **Versão local/offline** executada em máquina sem internet
- [ ] Nome e logo trocados por configuração, sem novo build de código
- [ ] Ambiente hospedado estável durante todo o período da demonstração
- [ ] Plano B pronto: apresentar pela cópia offline se a rede falhar

---

## Referências

- [`requisitos.md`](./requisitos.md) — especificação funcional completa (v2.0)
- [`requisitos-apresentacao.md`](./requisitos-apresentacao.md) — visão de negócio + matriz manter/acatar (§0.1)
- [`planejamento.md`](./planejamento.md) — planejamento de execução e marcos
- [Resumo da validação — 02/09/2026](./_MATERIAIS/materiais%20finais/Resumo_Visual_Validacao_Daniel_02-09-2026_ORDEM_DA_REUNIAO_v2_TRANSCRICAO.docx) — **fonte normativa**
- [Protótipo de validação v9](./_MATERIAIS/materiais%20finais/Climate_Action_Connect_Prototipo_Validacao_Daniel_v9.html) — storyboard UX + quadro de mudanças
- [Site navegável v13](./_MATERIAIS/materiais%20finais/Climate_Action_Connect_Preview_Site_Navegavel_v13_Consolidado.html) — referência de layout, copy e tokens
- ~~Protótipo v7~~ — superado, não usar
- Padrão técnico EJC — monorepo Node/Express/Prisma/React/Docker (elevado a produção)

---

*Documento v2.1 — arquitetura de alta performance (api + www + web + worker), alinhada à validação 02/09/2026. Comercialmente: protótipo navegável; tecnicamente: produto estruturado. Atualizar marcos ao fechar cada semana.*
