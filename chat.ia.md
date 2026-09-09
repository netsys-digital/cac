# Chat IA (RAG) — Climate Action Connect

Documento de referência para implementação futura de um chat em linguagem natural sobre a base do projeto.

## Objetivo

Permitir que usuários façam perguntas em linguagem natural e recebam respostas fundamentadas nos conteúdos publicados da plataforma (tecnologias, desafios, projetos, organizações, funding, casos), com citações e links para os itens usados.

## O que o projeto já tem

- Embeddings em tecnologias, desafios e projetos:
  - `TechnologyEmbedding`
  - `ChallengeEmbedding`
  - `ProjectEmbedding`
  - schema em `apps/api/prisma/schema.prisma`
- Provider OpenAI (`text-embedding-3-small`) + fallback keyword
  - config: `EMBEDDING_PROVIDER`, `OPENAI_API_KEY`, `EMBEDDING_MODEL` em `apps/api/src/config/env.ts`
- Indexação via worker/fila
  - `apps/api/src/lib/embeddings/indexer.ts`
  - `apps/api/src/lib/queue/embedding-queue.ts`
  - `apps/api/src/worker.ts`
- Busca híbrida com similaridade cosseno + score explicável
  - `apps/api/src/modules/search/search.service.ts`
  - `apps/api/src/modules/search/score.ts`
  - `MATCH_MIN_SCORE` e pesos de match no `.env`

Conclusão: a parte de **retrieval semântico** já existe de forma parcial. Falta a camada de **chat + geração** (RAG completo).

## Fluxo proposto

1. Usuário pergunta no chat (ex.: “Quem financia adaptação hídrica no Brasil?”)
2. Sistema gera embedding da pergunta
3. Busca nos conteúdos publicados (e, se necessário, joins no Postgres para filtros/contagens)
4. Monta contexto com trechos + metadados (título, org, país, link)
5. LLM responde em linguagem natural, **citando fontes da plataforma**
6. UI mostra resposta + cards/links dos itens usados

## Arquitetura sugerida (encaixe no monorepo)

| Camada | Onde |
|--------|------|
| Chat UI | `apps/www` (widget flutuante ou rota `/chat`) |
| API | `POST /api/chat` em `@cac/api` |
| Retrieval | reaproveitar `search.service` + embeddings existentes |
| Geração | OpenAI/Anthropic com prompt restrito ao contexto recuperado |
| Guardrails | só conteúdo `PUBLISHED`; não inventar IDs/fatos fora do contexto |

Escopo de produto a decidir na implementação:

- Chat só no portal público (`www`)?
- Também no painel autenticado (`web`)?

## Dois modos úteis

1. **RAG documental** (mais natural): responde com base em textos/embeddings já indexados
2. **Text-to-SQL / tools** (mais preciso para números): “quantas soluções publicadas no Brasil?” → query Prisma/SQL controlada

O ideal costuma ser **híbrido**: retrieval semântico + ferramentas (contagem, filtro por país/tipo).

## Cuidados importantes

- **Alucinação**: obrigar citações e resposta “não sei / não encontrei na base” quando o contexto não cobrir
- **Escopo de dados**: só portal público vs. também dados do painel autenticado
- **Custo**: embeddings + LLM por mensagem; limitar histórico e tamanho do contexto
- **LGPD**: não enviar dados privados de conexões/usuários sem política clara
- **Offline**: `OFFLINE_MODE` limita embeddings reais — definir comportamento degradado do chat

## Esforço realista

- **MVP** (chat + top-k + resposta com links): cerca de **1–2 semanas**, aproveitando a busca atual
- **Produto maduro** (histórico, tools SQL, streaming, avaliação de qualidade): **várias sprints**

## MVP sugerido (checklist)

- [ ] Endpoint `POST /api/chat` com body `{ message, locale?, history? }`
- [ ] Reutilizar retrieval da busca híbrida (top-k conteúdos publicados)
- [ ] Prompt de sistema: responder só com o contexto; citar fontes; não inventar
- [ ] Resposta estruturada: texto + lista de fontes (`id`, `type`, `title`, `url`)
- [ ] UI no `www`: painel/chat simples (input + histórico da sessão)
- [ ] Streaming opcional (SSE) na v2
- [ ] Métricas: latência, tokens, taxa de “sem resultado”, feedback útil/não útil

## Variáveis de ambiente (futuras)

Sugestão — ainda não implementadas:

```env
CHAT_ENABLED=true
CHAT_LLM_PROVIDER=openai
CHAT_LLM_MODEL=gpt-4o-mini
CHAT_MAX_CONTEXT_ITEMS=8
CHAT_MAX_HISTORY_TURNS=6
```

Reaproveitar `OPENAI_API_KEY` e a infra de embeddings já existente.

## Referências internas

- Busca: `apps/api/src/modules/search/`
- Embeddings: `apps/api/src/lib/embeddings/`
- Schema: `apps/api/prisma/schema.prisma` (models `*Embedding`)
- Seed reindex: `apps/api/prisma/seed.ts` (`reindexAllPublished`)

## Status

Documento criado para implementação futura. Nenhuma feature de chat RAG está implementada neste momento.
`)