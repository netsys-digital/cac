# Climate Action Connect — Requisitos Finais (travados)

> **Fonte única de verdade** para desenvolvimento e demonstração.  
> Consolida a validação de 02/09/2026, os protótipos v9/v13 e as decisões da matriz *manter × acatar*.  
> **Plano de etapas:** [`requisito-dev-final.md`](./requisito-dev-final.md) · Detalhe técnico ampliado: [`requisitos_dev.md`](./requisitos_dev.md) · Negócio: [`requisitos-apresentacao.md`](./requisitos-apresentacao.md)

**Versão:** 1.0 — final  
**Data de travamento:** 2026-09-04  
**UX de referência:** [protótipo v9](./_MATERIAIS/materiais%20finais/Climate_Action_Connect_Prototipo_Validacao_Daniel_v9.html) · [site v13](./_MATERIAIS/materiais%20finais/Climate_Action_Connect_Preview_Site_Navegavel_v13_Consolidado.html)  
**Ata normativa:** [Resumo Validação Daniel 02/09/2026](./_MATERIAIS/materiais%20finais/Resumo_Visual_Validacao_Daniel_02-09-2026_ORDEM_DA_REUNIAO_v2_TRANSCRICAO.docx)

| Marco | Data | Entrega |
|---|---|---|
| **Marco 1** | **15/10/2026** | Núcleo navegável hospedado — entrega formal + demonstração |
| **Marco 2** | **novembro/2026** *(data a registrar)* | + inglês funcional · chatbot CAC · versão local/offline |

---

## Sumário

1. [Postura travada](#1-postura-travada)
2. [Decisões da matriz — status final](#2-decisões-da-matriz--status-final)
3. [Produto em uma frase](#3-produto-em-uma-frase)
4. [Cinco caminhos e o que saiu](#4-cinco-caminhos-e-o-que-saiu)
5. [Regras de navegação e identidade](#5-regras-de-navegação-e-identidade)
6. [Busca, filtros, score e match](#6-busca-filtros-score-e-match)
7. [Objetos e fluxos da entrega](#7-objetos-e-fluxos-da-entrega)
8. [Financiamento, casos e conexão](#8-financiamento-casos-e-conexão)
9. [Chatbot, idiomas e offline](#9-chatbot-idiomas-e-offline)
10. [Arquitetura e infraestrutura](#10-arquitetura-e-infraestrutura)
11. [Escopo por marco](#11-escopo-por-marco)
12. [Seed demonstrativo](#12-seed-demonstrativo)
13. [Critérios de aceite](#13-critérios-de-aceite)
14. [Fora de escopo até novembro](#14-fora-de-escopo-até-novembro)
15. [Pendências operacionais (não de produto)](#15-pendências-operacionais-não-de-produto)

---

## 1. Postura travada

| Dimensão | Decisão final |
|---|---|
| **Comercial (cliente)** | Entrega falada como **protótipo navegável e utilizável**, dimensionada pelo recurso disponível |
| **Técnica (equipe)** | Desenvolvimento de **alta performance** desde o dia 1 — sem MVP descartável |
| **Fundação** | API única, contratos, busca/match, governança, i18n, CI, worker, backups e deploy **não são cortáveis** |
| **Features de superfície** | Podem ser priorizadas/adiadas se o cronograma apertar — sem tocar na fundação |
| **Destino pós-novembro** | Núcleo **portável** (ONU ou Embrapa) — não apostar em um único destino |

```
Cliente vê: protótipo navegável (15/10) → apresentação (novembro)
Equipe entrega: produto estruturado sobre a mesma base
```

---

## 2. Decisões da matriz — status final

Todas as recomendações da rodada “decidir agora” foram **acatas / mantidas** conforme abaixo.

| # | Apontamento | Decisão final |
|---|---|---|
| 1 | Entrega = protótipo, não “produto completo” | **Manter** postura técnica de produto; ao cliente falar **protótipo** |
| 2 | Pacote limitado ao recurso | **Manter fundação**; priorizar/cortar só features de superfície |
| 3 | Busca como centro | **Acatar** |
| 4 | Sai “Encontrar um parceiro” | **Acatar** — parceiro = consequência da conexão |
| 5 | Sai “Quem pode implementar?” | **Acatar** — nunca recomendar automaticamente |
| 6 | Entra casos de sucesso agora | **Acatar** — vitrine agora; replicação avançada depois |
| 7 | Financiamento = oferta ativa × diretório | **Acatar** |
| 8 | Match = retorno da busca | **Acatar** — sem rota/tela “match” |
| 9 | Perfil fora do menu / login contextual | **Acatar estrito** — vale também no mobile (ver §5) |
| 10 | Identidade / representação | **Manter** governança; navegação pública continua leve |
| 11 | Rótulos da reunião | **Acatar** — “Publique um desafio” / “Publique e divulgue uma solução” |
| 12 | Inglês funcional | **Acatar** — i18n desde a S1; EN obrigatório no Marco 2 |
| 13 | Chatbot CAC | **Incluir** até novembro com escopo **simples** (interpretação + mesmo motor de busca; sem LLM avançado obrigatório) |
| 14 | Versão local/offline | **Acatar** formato **Docker Compose offline** (mesmo build) |
| 15 | Score / pesos | **Acatar** explicabilidade; **homologar pesos v1** da proposta (configuráveis) |
| 16 | Lista de filtros | **Fechada** — os 8 critérios da reunião (§6.2) |
| 17 | Nome e logo substituíveis | **Acatar** — branding por configuração |
| 18 | Destino ONU ou Embrapa | **Manter** núcleo portável |
| 19 | Replicação avançada de casos | **Adiada** (pós-novembro) |
| 20 | Chat interno | **Fora** — conexão via e-mail até novembro |
| 21 | Voz no chatbot (🎙️) | **Fora** da entrega — ícone do protótipo é só ilustrativo |
| 22 | Volumes do seed | **Acatar** volumes da reunião (§12) |

---

## 3. Produto em uma frase

**Climate Action Connect (CAC)** é uma plataforma global de matchmaking que conecta **desafios climáticos** a **soluções, projetos, organizações e financiamento** — com score explicável e conexão sobre o item concreto — com foco inicial em agricultura, sistemas alimentares e ação climática.

**Progressão:**

```
Desafio → Busca → Caminhos (resolver · financiar · projetos) → Detalhe → Conexão → Implementação
```

O parceiro **não** se busca como porta; aparece como consequência do match e da conexão.

---

## 4. Cinco caminhos e o que saiu

### 4.1 Portas da Home (definitivas)

| # | Caminho | Função |
|---|---|---|
| 01 | **Encontre uma solução** | Soluções, tecnologias, práticas, projetos, iniciativas, políticas e programas |
| 02 | **Encontre um financiamento** | Ofertas ativas (prioridade) + diretório de referência |
| 03 | **Publique um desafio** | Registra problema, contexto e necessidade |
| 04 | **Publique e divulgue uma solução** | Registra o que oferece e *que problema ajuda a resolver* |
| 05 | **Conheça casos de sucesso** | Vitrine de experiências e evidências |

Nav pública (rótulos curtos): `Buscar · Financiamento · Desafio · Ofereça · Casos`.

### 4.2 Explicitamente fora

| Item | Motivo |
|---|---|
| Encontrar um parceiro (porta) | Parceiro = consequência |
| Quem pode implementar? (caminho do match) | Sem base para afirmar |
| Chat interno | E-mail basta nesta entrega |
| Voz no chatbot | Fora do escopo |
| Replicação avançada de casos | Pós-novembro |

---

## 5. Regras de navegação e identidade

| Regra | Definição travada |
|---|---|
| Navegação pública aberta | Buscar, filtrar, abrir detalhes e ler casos **sem login** |
| Perfil fora do menu | **Desktop e mobile:** Perfil **não** é item da nav pública |
| Nav mobile (rodapé) | `Início · Buscar · Desafio · Casos` — **sem** ícone Perfil |
| Conta / Entrar | Em `nav-actions` (desktop) ou fluxo contextual; após login, conta acessível de forma contextual |
| Identificação contextual | Login só em ações de escrita: publicar, solicitar conexão, representar organização |
| Representação institucional | Fluxo obrigatório para quem publica em nome de instituição: conta → vínculo → solicitar → validar → permissões |
| Cadastro ≠ representação | Declarar-se “Embrapa” **não** basta — organização, unidade, vínculo e interesse |

---

## 6. Busca, filtros, score e match

### 6.1 Regras centrais

| Regra | Definição |
|---|---|
| Busca = porta principal | Banner + “O que você está procurando?” |
| Escopo fechado | Só conteúdo da plataforma — sem busca na web |
| Match = retorno da busca | `POST /api/search` devolve resultados + facets + 3 caminhos |
| Sem tela “match” | Não existe rota/consulta separada de match |
| Interpretação visível | desafio · contexto · setor · intenção |
| Composição visível | Ex.: *128 = 48 soluções + 28 projetos + 30 orgs + 22 financiadores* |

### 6.2 Oito filtros (lista fechada)

| # | Filtro | Exemplos de valores |
|---|---|---|
| 1 | País / região | Brasil, África, América Latina, Europa… (listas completas e editáveis no admin) |
| 2 | Tema | Adaptação · Mitigação · Ambos |
| 3 | Tipo de ator | ICT / pesquisa · Empresa · Governo · Organização local |
| 4 | Setor | Agricultura · Pecuária · Florestas · Água… |
| 5 | Maturidade / prontidão | Pesquisa · Validação · Demonstração · Pronta para implementação · Em escala |
| 6 | Escala | Local · Regional · Replicável · Nacional · Global |
| 7 | Financiamento | Com oportunidade · Todos |
| 8 | Tipo de conteúdo | Solução · Projeto · Organização · Financiador · Caso |

### 6.3 Score v1 (homologado como default)

| Fator | Peso |
|---|---|
| Similaridade semântica | 40% |
| Tags (tema, setor) | 25% |
| Região / escala | 15% |
| Maturidade | 10% |
| Necessidade × oferta | 10% |

- Exibição: 0–100%, arredondado  
- Limite mínimo default: **60%** (`MATCH_MIN_SCORE`)  
- **Obrigatório:** `factors[]` e painel *“Por que X%?”* — mesmo em fallback keyword  
- Pesos em **configuração** (env / Domain) — ajuste sem redeploy

### 6.4 Três caminhos do retorno (somente estes)

| Caminho | Conteúdo |
|---|---|
| **Quem pode resolver?** | Quem gera/oferece a solução |
| **Quem pode financiar?** | Ofertas ativas (prioridade) + perfis compatíveis do diretório |
| **Projetos relacionados** | Projetos, políticas, iniciativas e programas |

**Proibido:** `whoCanImplement` / “quem pode implementar”.

---

## 7. Objetos e fluxos da entrega

### 7.1 Objetos

| Objeto | Na entrega |
|---|---|
| Desafio | ✅ |
| Solução / Tecnologia (product-page) | ✅ |
| Organização (perfil público + verificação) | ✅ |
| Projeto / iniciativa / política / programa | ✅ buscável |
| Oferta ativa de financiamento | ✅ no matching |
| Diretório de financiadores | ✅ referência (não implica chamada aberta) |
| Caso de sucesso | ✅ vitrine + curadoria |
| Conexão (sobre o item) | ✅ |
| Resultado de correspondência | ✅ |

### 7.2 Duas experiências, uma base

| App | Papel |
|---|---|
| **`@cac/www`** | Portal público — descoberta, busca, detalhe, financiamento, casos, chatbot |
| **`@cac/web`** | Painel — auth, wizards, conexões, representação, admin/curadoria |
| **`@cac/api`** | Única fronteira de dados — Prisma, Redis, SMTP, uploads, workers |

### 7.3 Papéis

Administrador · Curador · Gestor da organização · Membro · Visitante.

### 7.4 Estados de conteúdo

`Rascunho → Em revisão → Publicado → Arquivado`

Oferta só entra na busca/match quando **qualificada/publicada**.

---

## 8. Financiamento, casos e conexão

### 8.1 Financiamento

| | Ofertas ativas | Diretório |
|---|---|---|
| Pergunta | Quem financia **agora**? | Quem **tradicionalmente** apoia? |
| Matching | **Sim** | Não |
| Quem cadastra | A própria instituição | Curadoria |
| Aviso | Prazo, valor/faixa, critérios, link | Estar no diretório **≠** chamada aberta |

### 8.2 Casos de sucesso

- Ciclo: submissão → curadoria → padronização → publicação  
- Ficha: contexto, evidências (fotos/vídeos/resultados/método), necessidades  
- Exemplo-âncora: Moçambique · escassez hídrica · captação de água de chuva  
- Global↔Local como **narrativa**; replicação avançada **fora** desta entrega

### 8.3 Conexão

- Sempre sobre **item concreto** (`targetType` + `targetId`)  
- Ações: abrir · tenho interesse / seguir · favoritar / salvar · solicitar conexão  
- Objetivos: conhecer melhor · implementar · parceria · financiamento  
- Estados: pendente → aceita / recusada / expirada → contato  
- Notificação por **e-mail** (sem chat interno)

---

## 9. Chatbot, idiomas e offline

### 9.1 Chatbot CAC (Marco 2) — escopo simples

```
Usuário relata problema → CAC interpreta/organiza → consulta o mesmo motor de busca → devolve caminhos
```

| Inclui | Não inclui |
|---|---|
| Interpretação por regras + consulta à base | LLM avançado como requisito |
| Mesmos 3 caminhos e score | Entrada por voz |
| UI “Converse com a CAC” (web + mobile) | Chat livre fora da base |

### 9.2 Idiomas

- PT-BR na base (Marco 1)  
- **EN funcional** obrigatório no Marco 2  
- Infra i18n desde S1; validação profissional dos textos EN antes da apresentação  
- `ContentTranslation` para conteúdo do seed

### 9.3 Offline (Marco 2)

| Item | Definição |
|---|---|
| Formato | `docker-compose.offline.yml` — **mesmo build** |
| Dados | Dump MySQL + embeddings pré-calculados + `uploads/` |
| Rede | `OFFLINE_MODE=true` — sem OpenAI ao vivo |
| Entrega | Pacote `.tar` / pasta + runbook em 1 comando |

### 9.4 Marca

`APP_BRAND_NAME`, `APP_BRAND_SHORT`, `APP_BRAND_LOGO` — substituíveis sem alterar código.

---

## 10. Arquitetura e infraestrutura

### 10.1 Princípios

- Só a `@cac/api` toca dados  
- Frontends são clientes HTTP  
- Contratos em `@cac/shared` (Zod)  
- UI compartilhada em `@cac/ui` desde S1  
- Worker separado (`api-worker`) para embeddings e e-mail  

### 10.2 Stack (produção)

| Camada | Escolha |
|---|---|
| Runtime | Node.js ≥ 20 LTS |
| API | Express 5 + TypeScript |
| ORM / DB | Prisma 6 + MySQL 8 |
| Cache / fila | Redis 7 |
| Front | React 19 + Vite 7 + React Router 7 |
| Auth | JWT access + refresh httpOnly (cross-app) |
| Embeddings | OpenAI `text-embedding-3-small` via `EmbeddingProvider` |
| Deploy | Docker Compose · nginx · TLS |
| Ambientes | dev · staging · prod · offline |
| Qualidade | CI (lint + test + build) · `/health` · `/ready` · logs JSON · backup MySQL |

### 10.3 Containers

```
Internet → nginx → www | web | api
                        api → MySQL + Redis + uploads
                        api-worker → embeddings + e-mail
```

---

## 11. Escopo por marco

### Marco 1 — 15/10 (P0-A)

Portal com 5 caminhos · busca + 8 filtros + score + facets + 3 caminhos · product-page · projetos buscáveis · financiamento (2 abas) · casos · publicação de desafio/solução/oferta · conexão sobre o item · favoritar/seguir · representação · admin (curadoria, KPIs, domínios) · seed · hospedagem staging/prod · responsivo.

### Marco 2 — novembro (P0-B)

EN funcional · chatbot simples · offline Docker · marca configurável · ensaio da apresentação.

### Desejável (só com folga)

Import CSV · feedback útil/não · histórico de buscas · forgot password · audit log UI · export CSV.

### Depois de novembro

App mobile / WhatsApp · replicação avançada de casos · chat interno · SSO · voz · ES/FR/AR · Sharm el-Sheikh · API pública · admin separado · SSR.

---

## 12. Seed demonstrativo

| Conteúdo | Volume |
|---|---|
| Soluções | 10–15 |
| Projetos / iniciativas / políticas | 5–10 |
| Países / contextos | 3–5 (incl. Brasil + Moçambique) |
| Desafios | 5–8 |
| Financiadores (ativas + diretório) | 5–10 |
| Casos de sucesso | ≥ 3 (incl. Moçambique) |
| Organizações | seleção curada |

**Cenário-âncora:** busca *“recuperação de pastagens em seca”* → scores **94% / 89% / 83%** + composição demonstrativa.

O seed é **entregável**, não script auxiliar.

---

## 13. Critérios de aceite

### 13.1 Marco 1

- [ ] Home com banner, busca e **5 caminhos**
- [ ] Nav **sem Perfil** (desktop e mobile)
- [ ] Busca pública com interpretação, **8 filtros**, score e composição
- [ ] *“Por que X%?”* com ≥ 3 fatores
- [ ] **3 caminhos** do match — **sem** “quem pode implementar”
- [ ] Product-page + informações complementares
- [ ] Financiamento: oferta ativa × diretório (com aviso)
- [ ] Caso de sucesso com evidências e necessidades
- [ ] Publicar desafio e publicar/divulgar solução (workflow de curadoria)
- [ ] Representação institucional até selo verificado
- [ ] Conexão sobre o item + e-mail aceitar/recusar
- [ ] Favoritar/salvar e seguir
- [ ] Admin: curadoria + KPIs + edição de países/regiões
- [ ] Responsivo (celular, tablet, desktop)
- [ ] Ambiente hospedado estável + seed nos volumes §12

### 13.2 Marco 2

- [ ] Interface EN funcional (textos revisados)
- [ ] Chatbot simples sobre a mesma base
- [ ] Offline Docker operável sem internet
- [ ] Nome/logo trocáveis por config
- [ ] Ensaio da apresentação concluído

### 13.3 Roteiro da demonstração (~20 min)

1. Home (5 caminhos)  
2. Busca âncora → scores e composição  
3. Product-page + “Por que 94%?”  
4. 3 caminhos do match  
5. Financiamento (2 abas)  
6. Caso Moçambique  
7. Publicar desafio  
8. Solicitar conexão sobre o item  
9. Chatbot CAC *(Marco 2)*  
10. Admin  
11. EN + offline *(Marco 2)*

---

## 14. Fora de escopo até novembro

- MVP técnico descartável / atalho de arquitetura  
- Porta “Encontrar parceiro”  
- Recomendação automática “quem pode implementar”  
- Chat interno  
- Entrada por voz  
- Replicação avançada de casos  
- LLM avançado como requisito do chatbot  
- App mobile / WhatsApp / SSO / API pública / idiomas além de PT+EN  

---

## 15. Pendências operacionais (não de produto)

Estas **não** reabrem o escopo funcional travado neste documento:

| # | Pendência | Ação |
|---|---|---|
| 1 | Data exata da apresentação de novembro | Registrar no planejamento |
| 2 | Quem valida organizações na operação | Definir curador(es) da demo |
| 3 | Hospedagem pós-novembro | Cloud genérica vs. infra Embrapa |
| 4 | Estilo CSS (Tailwind vs. CSS modules) | Escolher e travar na S1 |
| 5 | Revisão profissional dos textos EN | Agendar no Bloco B |

---

## Referências

| Documento | Papel após este arquivo |
|---|---|
| **Este arquivo (`requisito-final.md`)** | **Escopo e decisões travadas** |
| [`requisito-dev-final.md`](./requisito-dev-final.md) | **Etapas graduais de desenvolvimento e valor** |
| [`requisitos_dev.md`](./requisitos_dev.md) | Detalhe técnico ampliado (API, modelo, contratos) |
| [`requisitos-apresentacao.md`](./requisitos-apresentacao.md) | Narrativa para stakeholders |
| [`planejamento.md`](./planejamento.md) | Execução e marcos de sprint |
| Protótipos v9 + v13 | UX e copy |
| Resumo validação 02/09/2026 | Ata normativa |

> Em caso de conflito, **este documento prevalece** sobre versões anteriores de requisitos. Protótipo v7 está **superado**.

---

*Requisitos finais v1.0 — travados em 2026-09-04 com base nas recomendações da matriz manter/acatar.*
