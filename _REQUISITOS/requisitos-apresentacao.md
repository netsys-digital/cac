# Climate Action Connect — Apresentação do Produto

> Documento para validação com proponentes, gestores e stakeholders.  
> Versão acessível, sem detalhes de tecnologia ou infraestrutura.  
> **Escopo travado:** [`requisito-final.md`](./requisito-final.md) · **Técnico:** [`requisitos_dev.md`](./requisitos_dev.md) · **Execução:** [`planejamento.md`](./planejamento.md)  
> **Protótipos vigentes:** [validação v9](./_MATERIAIS/materiais%20finais/Climate_Action_Connect_Prototipo_Validacao_Daniel_v9.html) · [site navegável v13](./_MATERIAIS/materiais%20finais/Climate_Action_Connect_Preview_Site_Navegavel_v13_Consolidado.html)  
> **Fonte normativa da validação:** [Resumo 02/09/2026](./_MATERIAIS/materiais%20finais/Resumo_Visual_Validacao_Daniel_02-09-2026_ORDEM_DA_REUNIAO_v2_TRANSCRICAO.docx)

**Versão:** 2.1 — negócio alinhado à validação 02/09 + postura de produto (não MVP técnico)  
**Data:** 2026-09-04  
**Entrega do núcleo navegável:** **15 de outubro de 2026** — com demonstração ao cliente na data  
**Apresentação:** **novembro de 2026** *(data informada pelo cliente — a registrar)*

### Postura de entrega (comercial × técnica)

| Para o cliente | Para a equipe |
|---|---|
| Fala em **protótipo navegável e utilizável** até novembro, dimensionado pelo recurso disponível | Constrói desde o início como **produto de alta performance** — arquitetura, dados, busca, governança e infraestrutura prontos para evoluir |
| O "MVP" existe sobretudo como **enquadramento comercial** da proposta | Não se entrega atalho técnico de MVP: o núcleo já nasce estruturado para produção |

Os marcos de 15/10 e novembro **permanecem**. O que muda é a profundidade da fundação por trás do que o cliente vê.

---

## Sumário

0. [O que mudou na validação de 02/09/2026](#0-o-que-mudou-na-validação-de-02092026)
0.1. [Apontamentos do cliente — manter ou acatar](#01-apontamentos-do-cliente--manter-ou-acatar)
1. [Em uma frase](#1-em-uma-frase)
2. [O problema que queremos resolver](#2-o-problema-que-queremos-resolver)
3. [O que é o Climate Action Connect](#3-o-que-é-o-climate-action-connect)
4. [Como nos diferenciamos](#4-como-nos-diferenciamos)
5. [Relação com o Portal Sharm el-Sheikh](#5-relação-com-o-portal-sharm-el-sheikh)
6. [Como a plataforma se organiza](#6-como-a-plataforma-se-organiza)
7. [Duas experiências, um mesmo produto](#7-duas-experiências-um-mesmo-produto)
8. [Os cinco caminhos de ação](#8-os-cinco-caminhos-de-ação)
9. [Quem usa a plataforma](#9-quem-usa-a-plataforma)
10. [Papéis e permissões](#10-papéis-e-permissões)
11. [O que circula na plataforma](#11-o-que-circula-na-plataforma)
12. [Jornadas principais](#12-jornadas-principais)
13. [Funcionalidades da entrega](#13-funcionalidades-da-entrega)
14. [O coração do produto: correspondência inteligente](#14-o-coração-do-produto-correspondência-inteligente)
15. [Página de cada solução](#15-página-de-cada-solução)
16. [Conexões entre partes](#16-conexões-entre-partes)
17. [Financiamento orientado à implementação](#17-financiamento-orientado-à-implementação)
18. [Classificação, filtros e busca](#18-classificação-filtros-e-busca)
19. [Confiança, curadoria e governança](#19-confiança-curadoria-e-governança)
20. [Painel administrativo](#20-painel-administrativo)
21. [Como medir sucesso](#21-como-medir-sucesso)
22. [O que entra agora e o que fica para depois](#22-o-que-entra-agora-e-o-que-fica-para-depois)
23. [Cronograma até a apresentação](#23-cronograma-até-a-apresentação)
24. [Como será a demonstração](#24-como-será-a-demonstração)
25. [Critérios para considerar a entrega pronta](#25-critérios-para-considerar-a-entrega-pronta)
26. [Decisões que ainda precisam ser tomadas](#26-decisões-que-ainda-precisam-ser-tomadas)
27. [Riscos e premissas](#27-riscos-e-premissas)

---

## 0. O que mudou na validação de 02/09/2026

A reunião com Daniel redefiniu **o que entregamos, quando entregamos e como o usuário entra na plataforma**. Os protótipos **v9** e **v13** congelam a experiência. Este documento já reflete essas decisões de negócio — e a postura interna de **não tratar a fundação como MVP técnico**.

### O horizonte da entrega

Para o cliente, o objetivo imediato é **um protótipo navegável e utilizável** para a apresentação de novembro, buscando o máximo possível dentro do recurso disponível — incluindo a visão do chatbot. Para a equipe, esse horizonte comercial **não autoriza** atalho de arquitetura: o núcleo já nasce como produto estruturado.

| Fase | Quando | O que o cliente vê | O que a equipe estrutura |
|---|---|---|---|
| **Agora** | **15/out** | Núcleo navegável hospedado — **entrega formal com demonstração** | Monorepo, API única, busca/match, governança, seed, staging |
| **Novembro** | novembro | Demo + **versão local/offline** + **inglês** + **chatbot CAC** | i18n completo, chatbot sobre o mesmo motor, pacote offline, marca configurável |
| **Depois** | pós-novembro | Novo escopo (ONU ou Embrapa) | Evolução sobre a mesma base — sem reescrever o núcleo |

Duas exigências práticas do cliente: **hospedagem** durante todo o período da demonstração e uma **cópia local/offline**. Princípio: a solução continua aproveitável **mesmo se a destinação final mudar**.

### O quadro de mudanças (já refletido nos protótipos v9/v13)

| | Item | Decisão |
|---|---|---|
| **Entra** | **Busca como centro** | A busca geral é a principal porta de entrada: busca → filtros → resultados → score → detalhe → conexão |
| **Entra** | **Conheça casos de sucesso** | Quinto caminho da Home. Conhecimento sai da Fase 2 e entra agora |
| **Entra** | **Chatbot CAC** | Incluído no pacote até novembro, com escopo técnico controlado |
| **Entra** | **Inglês funcional** | Deixa de ser "desejável" e passa a ser requisito da apresentação |
| **Entra** | **Versão local/offline** | Novo entregável |
| **Muda** | **Publique um desafio** | Substitui a linguagem genérica de "publicar uma necessidade" |
| **Muda** | **Publique e divulgue uma solução** | Novo rótulo do caminho de oferta |
| **Muda** | **Financiamento** | Separa **ofertas ativas** (chamadas vigentes) de **diretório** (instituições de referência) |
| **Muda** | **O match é o retorno da busca** | Não existe consulta de match separada |
| **Muda** | **Perfil sai do menu** | Navegação pública aberta; identificação apenas no contexto da ação |
| **Sai** | **Encontrar um parceiro** | Não existe como jornada independente — o parceiro aparece como consequência do match |
| **Sai** | **Quem pode implementar?** | Não há base para o sistema afirmar quem efetivamente implementará |
| **Mantém** | **Identidade e governança** | Continua essencial para quem propõe/cadastra e para validar representação institucional |

### O que segue inalterado

Quatro camadas · rede de objetos (desafios, soluções, organizações, financiamento, projetos, conexões e resultados) · score transparente com explicação · indicadores e painel administrativo · estados de conteúdo e de conexão · notificações por e-mail · responsividade em celular, tablet e desktop · arquitetura preparada para integrações futuras.

### Como a versão avança

```
OK do cliente → congelar versão (v9 + v13) → requisitos → planejamento → desenvolvimento de alta performance
```

O desenvolvimento trabalha sobre uma lógica **já validada**, não sobre interpretações diferentes da reunião.

---

## 0.1 Apontamentos do cliente — manter ou acatar

Quadro para decidir em equipe. **Status sugerido** é a recomendação interna; a coluna **Decisão** fica em aberto até o alinhamento.

| # | Apontamento (cliente / reunião) | O que isso muda | Recomendação | Decisão |
|---|---|---|---|---|
| 1 | Entrega = **protótipo navegável**, não "produto completo" | Enquadramento comercial | **Manter postura técnica de produto**; falar "protótipo" ao cliente | ☐ Manter · ☐ Acatar literal (MVP técnico) |
| 2 | Pacote limitado ao **recurso disponível** | Pressão por cortar escopo | **Acatar priorização de features**; **não cortar** fundação (API, busca, infra, i18n) | ☐ Manter fundação · ☐ Cortar também infra |
| 3 | **Busca como centro** da Home | Jornada principal | **Acatar** — já nos protótipos v9/v13 | ☐ Acatar · ☐ Reverter |
| 4 | **Sai** "Encontrar um parceiro" como porta | Menos um caminho na Home | **Acatar** — parceiro = consequência da conexão | ☐ Acatar · ☐ Manter caminho parceiro |
| 5 | **Sai** "Quem pode implementar?" automático | Menos um caminho do match | **Acatar** — protege confiança institucional | ☐ Acatar · ☐ Manter sugerir implementador |
| 6 | **Entra** "Conheça casos de sucesso" agora | Quinto caminho + curadoria | **Acatar** — vitrine agora; replicação depois | ☐ Acatar · ☐ Adiar casos |
| 7 | Financiamento = **oferta ativa × diretório** | Dois modos na mesma tela | **Acatar** — oferta participa do match; diretório não | ☐ Acatar · ☐ Modelo único |
| 8 | **Match = retorno da busca** | Sem tela/rota "match" | **Acatar** — impacto forte na API e na UX | ☐ Acatar · ☐ Match separado |
| 9 | **Perfil fora do menu**; login contextual | Nav pública aberta | **Acatar** no desktop; **decidir** nav mobile (protótipo mostra Perfil no rodapé) | ☐ Acatar estrito · ☐ Perfil só no mobile |
| 10 | Daniel **questionou identidade**; discussão manteve para quem publica | Governança | **Manter** fluxo de representação; **acatar** nuance (navegação sem cadastro pesado) | ☐ Manter governança · ☐ Afrouxar |
| 11 | Rótulos: **Publique um desafio** / **Publique e divulgue uma solução** | Copy e wizards | **Acatar** formulação da reunião (v9/v13) | ☐ Acatar · ☐ Manter "necessidade/oferta" |
| 12 | **Inglês funcional** + validação profissional | Bloco B | **Acatar** — i18n desde a S1 | ☐ Acatar · ☐ Adiar EN |
| 13 | **Chatbot CAC** até novembro, sem IA sofisticada obrigatória | Escopo e risco | **Acatar inclusão**; **decidir profundidade** (regras+busca vs LLM) | ☐ Simples · ☐ LLM controlado · ☐ Adiar |
| 14 | **Versão local/offline** | Entregável novo | **Acatar**; **decidir formato** (Docker offline vs instalável) | ☐ Docker · ☐ Outro |
| 15 | Score é **qualificação da pesquisa**; fórmula ainda aberta | Transparência | **Acatar explicabilidade**; **homologar pesos** antes de travar | ☐ Pesos atuais · ☐ Ajustar |
| 16 | **Fechar lista** de filtros na especificação | 8 critérios discutidos | **Fechar e acatar** a lista da reunião (ver §18) | ☐ Fechar agora · ☐ Deixar aberto |
| 17 | Nome e logo **substituíveis** | Portabilidade ONU/Embrapa | **Acatar** — branding por config | ☐ Acatar · ☐ Marca fixa |
| 18 | Destinação pós-novembro: **ONU ou Embrapa** | Escopo futuro | **Manter** núcleo portável; não travar destino | ☐ Portável · ☐ Apostar em um |
| 19 | **Replicação avançada** de casos = futuro | Fora desta entrega | **Acatar adiamento** | ☐ Acatar · ☐ Antecipar |
| 20 | **Chat interno** não obrigatório no início | Conexão via e-mail | **Acatar** — e-mail basta até novembro | ☐ Acatar · ☐ Chat agora |
| 21 | Entrada por **voz** no chatbot (ícone 🎙️ no protótipo) | Expectativa visual | **Manter fora** da entrega; só UI ilustrativa se necessário | ☐ Fora · ☐ Incluir demo voz |
| 22 | Volumes do **seed demonstrativo** (10–15 soluções etc.) | Conteúdo da demo | **Acatar** volumes da reunião como entregável | ☐ Acatar · ☐ Ampliar / reduzir |

> **Travado em 2026-09-04:** todas as recomendações foram adotadas. Documento normativo: [`requisito-final.md`](./requisito-final.md).

---

## 1. Em uma frase

**Climate Action Connect (CAC)** é uma plataforma global de **matchmaking** que ajuda quem tem um **desafio climático** a encontrar **soluções, parceiros e financiamento** para implementar ação concreta — com foco inicial em agricultura, sistemas alimentares e ação climática.

---

## 2. O problema que queremos resolver

Hoje, muita informação sobre clima e agricultura **existe**, mas **não vira conexão**:

| Situação atual | O que falta |
|---|---|
| Formulários em planilhas e repositórios estáticos | A informação não conecta quem precisa com quem resolve |
| Vitrines de tecnologia | Listam ofertas, mas não orientam pela necessidade real |
| Bases de projetos | Dizem *"tenho um projeto"*, não *"tenho um desafio — quem pode ajudar?"* |

O CAC nasce para transformar informação dispersa em **caminhos de ação**: da necessidade à solução, do projeto ao parceiro, da ideia ao financiamento.

---

## 3. O que é o Climate Action Connect

### Proposição de valor

> *"Tenho um desafio, uma solução, um projeto ou recursos — quem no mundo pode me ajudar a implementar?"*

### Progressão que a plataforma apoia

```
Desafio → Busca → Caminhos de ação (solução · projeto · financiamento · organização) → Conexão → Implementação
```

> **Ajuste da validação:** "parceiro" não é mais uma etapa que se busca separadamente. O parceiro aparece como **consequência** do match e da conexão com um item concreto.

### O que conectamos

- **Quem tem necessidade** — governos, estados, nações, ONGs, organizações que precisam implementar algo
- **Quem tem solução** — Embrapa, universidades, ICTs, empresas, startups, organismos internacionais
- **Quem pode financiar** — fundos climáticos, bancos de desenvolvimento, fundações, investidores
- **Quem pode cooperar** — parceiros de pesquisa, capacitação e transferência de tecnologia

A plataforma combina **busca inteligente**, **páginas estruturadas de soluções** e um **índice de aderência** (score percentual) que mostra o quão bem uma oferta responde a uma necessidade.

---

## 4. Como nos diferenciamos

| Abordagem | Exemplo | Limitação |
|---|---|---|
| Repositório institucional | Portal Sharm el-Sheikh | Informa, mas não conecta ativamente |
| Inventários e metas | Plataformas de carbono / Net Zero | Foco em medição, não em implementação |
| Vitrine de ecossistema | Startup Nation Finder (Israel) | Boa referência de filtros e perfis, mas outro domínio |
| **Climate Action Connect** | Matchmaking por problema | Score + explicação + conexão entre partes |

**Referência inspiradora:** o [Startup Nation Finder](https://startupnationcentral.org/) organiza empresas, investidores e tendências com filtros por estágio, setor e tipo de ator — sem tratar "investidor" como categoria única. O CAC aplica lógica semelhante para **financiadores**, **soluções** e **organizações** no contexto climático e agroalimentar.

---

## 5. Relação com o Portal Sharm el-Sheikh

O CAC **complementa** (não substitui) o [Portal Online de Sharm el-Sheikh](https://unfccc.int/), criado na COP27 (Decisão 3/CP.27, UNFCCC).

| Portal Sharm el-Sheikh | Climate Action Connect |
|---|---|
| Repositório de projetos, políticas e iniciativas | Camada de **matchmaking orientada à implementação** |
| *"Aqui está minha iniciativa"* | *"Tenho este desafio — quem pode me ajudar a implementar?"* |

A proposta da Embrapa não é criar uma iniciativa paralela à UNFCCC, mas **potencializar a implementação** do que o ecossistema global já produz em conhecimento e políticas.

---

## 6. Como a plataforma se organiza

O produto foi pensado em **quatro camadas conceituais**, que podem evoluir sem mudar o núcleo:

```
                 CLIMATE ACTION CONNECT
                         │
            ┌────────────┴────────────┐
            │                         │
     CAMADA GLOBAL              CAMADA LOCAL
     (institucional)            (acesso simplificado)
            │                         │
     Projetos, políticas        Página responsiva
     Tecnologias, soluções      Chatbot CAC
     Financiadores              Atores locais
            │                         │
            └────────────┬────────────┘
                         │
                   MATCHMAKING
              (é o retorno da busca)
                         │
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
   Quem pode        Quem pode        Projetos
    resolver        financiar      relacionados
                         │
              CONHECIMENTO (transversal)
            Casos de sucesso · evidências
```

| Camada | O que contém | Na entrega |
|---|---|---|
| **Institucional** | Projetos, políticas, iniciativas, programas | **Buscável** — entram nos resultados |
| **Soluções** | Tecnologias, práticas, pesquisa, soluções empresariais, conhecimento | **Completo** |
| **Matchmaking** | Desafios ↔ Soluções ↔ Financiamento ↔ Conexões | **Núcleo** |
| **Acesso local** | Página responsiva, **chatbot CAC**, atores locais | Página no núcleo; **chatbot em novembro**; app e WhatsApp depois |

**Conhecimento** atravessa todas as camadas: o aprendizado global apoia ação local, e experiências locais podem alimentar a rede global.

---

## 7. Duas experiências, um mesmo produto

Para o usuário final, a plataforma se divide em duas partes complementares — ambas alimentadas pela **mesma base de informações**:

### Portal público — descoberta e inspiração

**Para quem:** visitantes, pesquisadores, gestores explorando o que existe.

**O que faz:**
- Apresenta a proposta do CAC (banner + busca geral + **5 caminhos de ação**)
- Permite **buscar** soluções, projetos, iniciativas, políticas, organizações e financiadores
- Exibe **resultados com score de aderência** e a **composição do resultado** por tipo de conteúdo
- Mostra a **página completa de cada solução** (product-page)
- Exibe perfis públicos de organizações, desafios e **casos de sucesso**
- Separa **ofertas ativas de financiamento** do **diretório** de instituições
- Explica **"por que esta recomendação?"**

**Regra de acesso e navegação (validada em 02/09):**

| Regra | Descrição |
|---|---|
| Navegação pública aberta | Buscar, filtrar, abrir detalhes e ler casos **não exige login** |
| Perfil fora do menu principal | O perfil não é item da navegação principal nem ocupa a home |
| Identificação contextual | O login aparece no momento da ação: publicar, solicitar conexão ou representar uma organização |
| Área de conta | Depois do login, conta e perfil ficam disponíveis de forma contextual |

**Por quê:** quem apenas navega não precisa do mesmo nível de qualificação de quem propõe conteúdo em nome de uma instituição.

### Painel da organização — ação e gestão

**Para quem:** representantes de organizações cadastradas, curadores e administradores.

**O que faz:**
- Cadastro e login
- Vínculo entre pessoa e organização (com validação)
- Criação de **ofertas** — *"Publique e divulgue uma solução"* / *"O que você oferece?"*
- Publicação de **desafios** — *"Publique um desafio"*
- Publicação de **ofertas ativas de financiamento** (a própria instituição cadastra sua chamada)
- Submissão de **casos de sucesso** para curadoria
- Gestão de conexões (solicitar, aceitar, recusar) e de itens salvos/seguidos
- Área administrativa: curadoria, verificação de organizações, indicadores

**Fluxo típico:** o visitante encontra uma solução no portal → clica em *"Tenho interesse"* → é direcionado ao painel para login e envio da solicitação.

---

## 8. Os cinco caminhos de ação

A **busca geral é a principal porta de entrada**. Os cinco caminhos abaixo são atalhos de **intenção** sobre a mesma base e o mesmo motor de correspondência:

| # | Caminho | O que o usuário quer | Exemplo |
|---|---|---|---|
| 01 | 🔎 **Encontre uma solução** | Soluções, tecnologias, práticas, projetos, iniciativas, políticas e programas | *"Recuperação de pastagens em condições de seca"* |
| 02 | 💰 **Encontre um financiamento** | Chamadas vigentes e instituições que apoiam determinados temas | *"Chamada ativa para agricultura resiliente"* |
| 03 | 📢 **Publique um desafio** | Registrar um problema para a rede encontrar respostas | *"Perda de produtividade por seca no semiárido"* |
| 04 | 🌱 **Publique e divulgue uma solução** | Divulgar o que oferece e qual problema ajuda a resolver | *"Tecnologia de manejo adaptativo de pastagens"* |
| 05 | 📚 **Conheça casos de sucesso** | Experiências e evidências que inspiram novos caminhos | *"Captação de água de chuva para horticultura"* |

Na home, um **banner em destaque** e uma barra central reforçam a pergunta: **"O que você está procurando?"**

**Regra importante:** a busca consulta **somente o conteúdo conectado à plataforma** — não é uma busca na web aberta.

### O que saiu como porta de entrada

| Item | Por que saiu |
|---|---|
| 🤝 **Encontrar um parceiro** | Não existe como jornada independente. O parceiro/conexão passa a ser **consequência do match**, não uma porta separada. |
| **"Quem pode implementar?"** | O sistema não deve recomendar automaticamente: a plataforma não tem base para afirmar quem efetivamente implementará. |

---

## 9. Quem usa a plataforma

| Tipo de ator | Exemplos | O que busca na plataforma |
|---|---|---|
| **Demandante / implementador** | Governos, ministérios, estados, ONGs | Descrever necessidades; buscar soluções e parceiros |
| **Ofertante** | Embrapa, universidades, ICTs, empresas, startups | Cadastrar tecnologias e soluções; receber conexões |
| **Financiador** | Fundos climáticos, bancos de desenvolvimento, fundações | Indicar que tipo de implementação financia |
| **Parceiro de conhecimento** | Universidades, organismos internacionais | Pesquisa, capacitação, cooperação técnica |
| **Curador / administrador** | Equipe Embrapa / operação da plataforma | Curadoria, moderação, indicadores |
| **Visitante** | Pesquisador, analista externo | Buscar e visualizar (conexão exige cadastro) |

> Um mesmo ator pode ser **ofertante e demandante ao mesmo tempo** — por exemplo, a Embrapa oferece tecnologias e também busca parceiros internacionais.

### Modelo organizacional

- Uma pessoa pode pertencer a **uma ou mais organizações**
- Uma organização pode ter **vários representantes**
- Organizações podem ter relação **matriz ↔ unidade** (ex.: Embrapa central ↔ unidade de pesquisa)
- É possível definir **quem recebe notificações** de novas conexões

---

## 10. Papéis e permissões

| Papel | O que pode fazer |
|---|---|
| **Administrador** | Gestão completa: usuários, curadoria, classificações, indicadores |
| **Curador** | Aprovar ou rejeitar tecnologias, desafios e organizações |
| **Gestor da organização** | Gerenciar perfil institucional, membros e páginas de soluções |
| **Membro da organização** | Criar e editar rascunhos; responder conexões |
| **Visitante** | Busca pública; solicitar conexão após cadastro |

**Regra importante:** qualquer pessoa pode solicitar cadastro, mas o sistema **não presume** que ela representa uma instituição até que a **verificação** seja concluída.

---

## 11. O que circula na plataforma

### Objetos principais

| Objeto | O que é | Na entrega |
|---|---|---|
| **Desafio** | Problema descrito por quem precisa de ajuda | ✅ Sim |
| **Solução / Tecnologia** | Oferta com página estruturada | ✅ Sim |
| **Organização** | Perfil institucional público | ✅ Sim |
| **Oferta ativa de financiamento** | Chamada ou edital vigente, com prazo — **entra no matching** | ✅ Sim |
| **Diretório de financiadores** | Instituições de referência; estar no diretório **não** significa chamada aberta | ✅ Sim |
| **Projeto, iniciativa, política, programa** | Registro institucional que aparece nos resultados | ✅ Sim |
| **Conexão** | Solicitação **sobre um item concreto** entre duas partes | ✅ Sim |
| **Resultado de correspondência** | Lista ranqueada com score + caminhos + explicação | ✅ Sim |
| **Caso de sucesso** | Experiência curada com evidências e necessidades declaradas | ✅ Sim — **entrou na validação** |
| **Replicação automatizada de casos** | Levar um caso validado para outros territórios | 🔜 Evolução |

### Tipos de solução que podem ser cadastrados

Tecnologias digitais · cultivares · práticas agrícolas · sistemas de produção · metodologias · ferramentas de diagnóstico · plataformas · conhecimentos · tecnologias sociais · soluções de adaptação e mitigação.

### Cadastro de oferta — *"O que você oferece?"*

Tecnologia · Conhecimento · Pesquisa · Capacitação · Projeto · Infraestrutura · Financiamento · Cooperação técnica · Dados · Parceria

**Pergunta obrigatória:** *"Que problema você ajuda a resolver?"*

### Cadastro de demanda — *"O que você procura?"*

Tecnologia · Financiamento · Parceiro de implementação · Conhecimento · Capacitação · Pesquisa · Dados · Cooperação técnica · Escala · Mercado

**Pergunta obrigatória:** *"Qual problema você precisa resolver?"*

---

## 12. Jornadas principais

### Jornada do ofertante

```
Cadastrar organização
    → Criar solução (rascunho)
    → Enviar para revisão
    → Curadoria aprova
    → Página pública publicada
    → Recebe solicitações de conexão
    → Aceita ou recusa
```

### Jornada do demandante

```
Cadastrar organização
    → Descrever necessidade (texto livre ou formulário)
    → Buscar com filtros e linguagem natural
    → Ver resultados com score
    → Abrir páginas de soluções
    → Solicitar conexão
    → Aguardar resposta
    → Contato estabelecido por e-mail
```

### Tipos de correspondência que o sistema realiza

> **O match é o retorno da busca.** Não existe uma consulta de match separada: a própria busca é o comando.

```
O usuário busca → a busca define o contexto → o sistema cruza registros → o match retorna vários caminhos
```

Exemplo: *"recuperação de pastagem"* → **4 projetos semelhantes + 3 organizações/parceiros relacionados + 2 financiadores**.

| De | Para | Resultado |
|---|---|---|
| Desafio / busca | Solução | Tecnologias e práticas aderentes |
| Desafio / busca | **Quem pode resolver** | Quem gera ou oferece a solução: Embrapa, universidades, empresas |
| Desafio / busca | **Quem pode financiar** | Instituições que financiam temas e projetos compatíveis |
| Desafio / busca | **Projetos relacionados** | Projetos, políticas, iniciativas e programas ligados ao contexto |
| Tecnologia | Demanda | Organizações com necessidades compatíveis |
| Caso de sucesso | Replicação | Oportunidades em outros contextos — **visão futura** |

**Saiu:** ~~Organização → Parceiro~~ como correspondência independente e ~~"quem pode implementar"~~ como recomendação automática.

### A rede não é linear

As conexões formam uma **rede**, não uma sequência rígida:

```
Demandante ↔ Projeto ↔ Tecnologia ↔ Ofertante ↔ Financiador
```

---

## 13. Funcionalidades da entrega

### Busca e descoberta

- **Banner em destaque** + barra principal *"O que você está procurando?"* como principal porta de entrada
- Exemplos demonstrativos clicáveis (recuperação de pastagens, agricultura resiliente, segurança hídrica, soluções para seca)
- Busca em **linguagem natural** (interpretada de forma inteligente)
- **Escopo fechado:** pesquisa somente o conteúdo conectado à plataforma
- A **interpretação** do pedido é mostrada ao usuário (desafio · contexto · setor · intenção)
- Filtros combináveis em 8 critérios: país/região · tema · tipo de ator · setor · maturidade/prontidão · escala · financiamento · tipo de conteúdo
- Resultados agrupados: **soluções, projetos, organizações, financiadores**
- **Composição do resultado visível** — por exemplo: *128 resultados = 48 soluções + 28 projetos + 30 organizações + 22 financiadores*
- Listas de países e regiões **completas e editáveis**, para permitir ajuste e demonstração

> **A fechar na especificação:** a lista definitiva de critérios de filtro.

### Publique e divulgue uma solução — *"O que você oferece?"*

- Fluxo guiado de cadastro
- Tipos de oferta configuráveis
- Campo obrigatório: *"Que problema você ajuda a resolver?"*
- Onde pode ser aplicado e maturidade/prontidão
- Sugestão automática de classificações (tags)
- Estados: **rascunho → em revisão → publicado → arquivado**
- **A oferta precisa estar qualificada** para entrar nas buscas e no match

### Publique um desafio

- Fluxo guiado: **identificar → descrever → classificar → publicar → receber correspondências**
- Título, descrição (contexto, problema, resultado esperado), localização, tema/setor
- *"O que você precisa?"* — tecnologia · conhecimento · parceria · financiamento · capacitação · pesquisa
- Custo estimado (opcional)
- Identidade e organização informadas no ato da publicação
- Opção de desafio público ou restrito (desejável)

### Conheça casos de sucesso

- Vitrine de experiências, evidências e aprendizados
- Ciclo do caso: **submissão → curadoria → padronização → publicação como referência**
- Ficha do caso: contexto, problema, abordagem, **evidências** (fotos, vídeos, resultados, método), custo e **necessidades** (financiamento, parceiro, equipamento)
- Possibilidade de solicitar conexão a partir do caso
- Narrativa **Global → Local** e **Local → Global** apresentada como visão
- *Exemplo de referência: Moçambique • escassez hídrica • horticultura • captação de água de chuva*

> A **replicação avançada** é uma visão futura, não uma obrigação desta entrega.

### Perfil organizacional

- Página pública com endereço próprio (URL amigável)
- Informações: tipo, país, região, áreas de atuação
- Seções **"Oferece"** e **"Procura"**
- Lista de soluções vinculadas
- Selo de **organização verificada**
- Múltiplos usuários por organização

### Correspondência (match)

- **O match é o retorno da busca**, não uma consulta separada
- **Score de aderência em percentual** (ex.: 94%, 89%, 83%) — é a **qualificação da pesquisa**
- Painel **"Por que 94%?"** com os fatores explicativos
- **Três caminhos** no retorno: *quem pode resolver* · *quem pode financiar* · *projetos relacionados*
- Resultados abaixo de um limite mínimo de aderência ficam ocultos (padrão: 60%)
- Feedback do usuário (útil / não relevante) — desejável

**O sistema não sugere "quem pode implementar".** Essa informação pode ser declarada pelo próprio conteúdo, mas não é recomendada automaticamente.

### Conexão

- **A conexão é feita com o item escolhido** — uma solução, um projeto, uma oferta, um caso — nunca com um "match" abstrato
- Ações no item: abrir detalhe · *tenho interesse / seguir* · *favoritar / salvar* · *solicitar conexão*
- Objetivos da solicitação: **conhecer melhor · implementar a solução · parceria · financiamento**
- Sem chat interno obrigatório no início — solicitação + **notificação por e-mail**
- Campos: objetivo, contexto, urgência
- Estados: **pendente → aceita / recusada / expirada → contato**
- Prazo de resposta configurável, com lembrete

### Financiamento

Duas naturezas claramente separadas na mesma tela:

| | Ofertas ativas | Diretório |
|---|---|---|
| O que é | Chamadas e editais **vigentes** | Instituições de **referência** |
| Participa do matching | **Sim** | Não |
| Quem cadastra | **A própria instituição** | Curadoria / cadastro |
| Aviso ao usuário | Prazo, valor/faixa, critérios, link oficial | *Estar no diretório não significa ter chamada aberta* |

- Prioridade para **ofertas ativas**; o diretório serve como referência
- Tipos: fundo climático, banco de desenvolvimento, fundação, investidor, governo, agência de cooperação, fundo privado
- Filtros: região, país, tema, estágio, instrumento financeiro, adaptação/mitigação
- O auto-cadastro da chamada **reduz a dependência de curadoria central**

### Identidade e representação institucional

- Fluxo de cinco passos: **criar conta → organização/vínculo → solicitar representação → validar → permissões**
- Dados de qualificação: organização, **unidade**, vínculo e interesse
- **Cadastro de pessoa não equivale a representação institucional** — não basta alguém se declarar "Embrapa"
- Selo de **perfil verificado** visível no conteúdo publicado
- Quem apenas navega **não** precisa do mesmo nível de qualificação

### Idiomas e apresentação internacional

- **Interface em inglês funcional** para a apresentação
- Tradução assistida do conteúdo cadastrado
- **Validação profissional** dos textos de interface e da narrativa
- **Nome do produto e logo substituíveis** por configuração, sem alterar o sistema

### CAC — o chatbot

- O usuário **relata um problema** → o CAC **interpreta e organiza** → a plataforma **consulta a base** → retorna **soluções, projetos, financiamento e conhecimento**
- Usa o **mesmo núcleo de dados** e o mesmo motor de busca da plataforma
- Escopo controlado: **IA/ML sofisticado não é requisito obrigatório** sem definição técnica prévia

### Hospedagem e versão local/offline

- **Hospedagem garantida** durante todo o período da demonstração
- **Cópia local/offline** operável sem internet, com o conteúdo demonstrativo embarcado
- A solução permanece aproveitável **caso a destinação final mude**

---

## 14. O coração do produto: correspondência inteligente

O matchmaking é o **diferencial central** do CAC. Não basta listar soluções — é preciso **ranquear e explicar** por que uma solução faz sentido para um determinado desafio.

### Como funciona (visão simplificada)

```
Entrada do usuário (texto + filtros)
        │
        ▼
Entendimento do pedido (tema, contexto, região...)
        │
        ▼
Busca na base de soluções, desafios, organizações e financiadores
        │
        ▼
Cálculo de aderência (score composto)
        │
        ▼
Resultados ordenados + explicação visível
```

### Fatores que compõem o score (versão inicial)

| Fator | Peso | O que mede |
|---|---|---|
| Similaridade de significado | 40% | Quão parecido é o texto do desafio com a solução |
| Classificações (tags) | 25% | Tema, setor, adaptação/mitigação em comum |
| Região e escala | 15% | Compatibilidade geográfica e de abrangência |
| Maturidade (TRL) | 10% | Alinhamento do nível de prontidão tecnológica |
| Tipo de oferta vs. demanda | 10% | Se o que se oferece corresponde ao que se busca |

**Resultado:** score de **0 a 100%**, exibido de forma arredondada. Recomendações abaixo de 60% não são mostradas por padrão.

> **Pendência assumida na validação:** os pesos acima são uma **proposta técnica ainda não homologada**. A fórmula final será definida na especificação técnica. O que é **obrigatório** é que os fatores sejam explicáveis na interface.
>
> O caminho do score, como discutido na reunião:
>
> ```
> texto + filtros → contexto + tema + setor + maturidade + necessidade + região → score → lista ordenada + explicação
> ```

### Painel "Por que este match?"

O usuário vê não só o percentual, mas **os fatores que levaram àquela recomendação** — por exemplo:

- Tema: alta compatibilidade
- Contexto regional: compatível
- Maturidade: pronta para implementação
- Tipo de necessidade: alinhado

Isso aumenta **confiança e transparência**, especialmente em contextos institucionais e internacionais.

### Rede de correspondências

Para um mesmo desafio, o sistema devolve simultaneamente **três caminhos**:

| Caminho | O que traz |
|---|---|
| **Quem pode resolver?** | Quem gera ou oferece a solução: Embrapa, universidades, empresas e outras organizações |
| **Quem pode financiar?** | Instituições que financiam temas e projetos compatíveis |
| **Projetos relacionados** | Projetos, políticas, iniciativas e programas ligados ao contexto |

E a composição do resultado fica visível — por exemplo: *128 resultados = 48 soluções + 28 projetos + 30 organizações + 22 financiadores*.

> **Não incluímos "quem pode implementar".** A plataforma não tem base para afirmar quem efetivamente implementará uma solução, e uma recomendação dessas comprometeria a confiança no restante.

---

## 15. Página de cada solução

Cada tecnologia ou solução tem uma **página pública dedicada**, inspirada em vitrines profissionais de mercado (como o Finder do Startup Nation Central).

### Estrutura da página

| Seção | Conteúdo | Obrigatório na entrega |
|---|---|---|
| **Cabeçalho** | Nome, organização ofertante, selos, nível de maturidade (TRL) | Sim |
| **Problema resolvido** | Descrição orientada ao desafio que a solução atende | Sim |
| **Como funciona** | Explicação técnica acessível | Sim |
| **Resultados comprovados** | Métricas, estudos, casos | Desejável |
| **Requisitos de implementação** | Infraestrutura, capacitação, custo estimado | Desejável |
| **Condições de transferência** | Licença, cooperação, propriedade intelectual | Desejável |
| **Mídia** | Imagens, vídeos, documentos PDF | Desejável |
| **Classificações** | Temas, setores, ODS, adaptação/mitigação | Sim |
| **Projetos relacionados** | Links na plataforma | Sim |
| **Financiamento relacionado** | Ofertas ativas e financiadores compatíveis | Sim |
| **Explicação do score** | Painel *"Por que 94%?"* | Sim |
| **Ação** | *"Tenho interesse"* · *"Favoritar / Salvar"* · *"Solicitar conexão"* | Sim |

Uma seção de **informações complementares** agrupa **implementação** (requisitos, capacitação e custo quando disponíveis), **projetos relacionados** e **financiamento**.

---

## 16. Conexões entre partes

### Ciclo de vida de uma conexão

```
Solicitação criada (PENDENTE)
        │
        ├── Aceita ──► Contato compartilhado (e-mail) ──► Encerrada (com registro de resultado)
        ├── Recusada
        └── Expirada (sem resposta no prazo)
```

### Notificações por e-mail

| Evento | Quem recebe |
|---|---|
| Nova solicitação de conexão | Ofertante / gestor da organização |
| Lembrete (7 dias sem resposta) | Ofertante |
| Conexão aceita | Demandante |
| Conexão recusada | Demandante |
| Conexão expirada | Ambas as partes |

**Na entrega inicial não há chat interno.** A plataforma **facilita o primeiro contato**; a conversa segue por e-mail ou canais externos.

### Tipos de interesse na solicitação

- Conhecer melhor (exploratório)
- Implementar a solução
- Estabelecer parceria
- Buscar financiamento

**Regra validada:** a solicitação é sempre feita **sobre o item escolhido** — uma solução, um projeto, uma oferta de financiamento ou um caso — e não sobre um "match" abstrato. É isso que dá contexto à conversa que vem depois.

---

## 17. Financiamento orientado à implementação

O CAC não trata financiadores como uma lista telefônica. Cada perfil responde à pergunta:

> *"Que tipo de implementação este financiador procura apoiar?"*

### Duas naturezas separadas (validado em 02/09/2026)

| | **Ofertas ativas** | **Diretório** |
|---|---|---|
| Pergunta que responde | *Quem está procurando financiar **agora**?* | *Quem **tradicionalmente** apoia?* |
| Conteúdo | Chamadas e editais vigentes | Instituições de referência |
| Participa do matching | **Sim** | Não |
| Quem cadastra | **A própria instituição** | Curadoria / cadastro |
| Campos | Instituição, prazo, o que financia, região, tema, valor/faixa, critérios, link oficial | Áreas de interesse, regiões, instrumentos, tipos de projeto apoiados |

A **prioridade é a oferta ativa**. O diretório é referência — e a interface precisa deixar explícito que **estar no diretório não significa ter uma chamada aberta**.

### Exemplos

| Tipo de financiador | Interesse típico |
|---|---|
| Fundo climático | Adaptação |
| Banco de desenvolvimento | Infraestrutura |
| Fundação | Agricultura familiar |
| Investidor | Tecnologia climática |
| Governo | Cooperação internacional |
| Fundo privado | Soluções baseadas na natureza |
| Agência de cooperação | Transferência tecnológica |

### Filtros do perfil financiador

Região · país · tema · tipo de projeto · estágio · instrumento financeiro · público-alvo · adaptação/mitigação · agricultura · pecuária · florestas · pesca

---

## 18. Classificação, filtros e busca

Para que a correspondência funcione, os conteúdos precisam ser **classificáveis e combináveis**. A plataforma usa um sistema de **tags e categorias** organizadas em grupos:

### Contexto

Tema · país · região · setor · Objetivos de Desenvolvimento Sustentável (ODS)

### Clima

Adaptação · mitigação · resiliência

### Projeto e solução

Tipo de ator · tipo de solução · estágio de maturidade · escala (local, regional, nacional, global)

### Recursos

Necessidade de financiamento · instrumento financeiro · público-alvo

### Necessidade

Tecnologia · conhecimento · parceria · financiamento · capacitação · pesquisa · equipamento

### Tipo de conteúdo

Solução · projeto · iniciativa · política · programa · organização · financiador · caso de sucesso

> **A completar antes da demonstração:** as listas de **países e regiões** precisam estar completas, e o administrador deve poder **editar** essas classificações — inclusive durante a apresentação.

### Sinônimos

Termos equivalentes são mapeados para classificações canônicas — por exemplo, *"metano"* pode ser associado a *mitigação na pecuária* — para melhorar resultados de busca.

---

## 19. Confiança, curadoria e governança

### Por que importa

Em uma plataforma global institucional, **nem todo cadastro equivale a representação verificada**. O CAC separa:

1. **Cadastro** — qualquer pessoa pode criar conta
2. **Vínculo com organização** — solicitação pendente de validação
3. **Solicitação de representação** — quem é a organização, qual unidade, qual vínculo, qual interesse
4. **Verificação institucional** — aprovação por curador ou administrador (perfil verificado)
5. **Permissões** — só então a pessoa pode publicar e editar em nome da instituição
6. **Publicação** — conteúdo revisado antes de ficar público

### Fluxo de validação institucional

```
Criar conta → Organização / vínculo → Validar representação → Perfil verificado → Permissões
```

**Exemplo concreto:** não basta alguém se declarar "Embrapa". É preciso saber **qual organização, qual unidade, qual vínculo e qual interesse**.

**Contrapartida:** quem **apenas navega** não precisa desse nível de qualificação. A navegação pública é aberta e a identificação só aparece quando o usuário vai agir.

### Curadoria de conteúdo

| Estado | Significado |
|---|---|
| **Rascunho** | Em elaboração pelo membro da organização |
| **Em revisão** | Enviado, aguardando curador |
| **Publicado** | Visível no portal público |
| **Arquivado** | Retirado da vitrine |

### Níveis de visibilidade

- **Público** — qualquer visitante
- **Restrito** — apenas usuários autorizados
- **Sob consulta** — visível mediante solicitação

### Selos e indicadores de confiança

- Organização verificada
- Conteúdo curado / validado
- Parceiro verificado (conforme governança definida)

---

## 20. Painel administrativo

Área reservada a curadores e administradores:

| Função | O que permite fazer |
|---|---|
| **Curadoria** | Aprovar, rejeitar ou solicitar ajustes em soluções, desafios, **casos de sucesso** e ofertas de financiamento |
| **Verificação de organizações** | Validar que uma pessoa pode representar uma instituição |
| **Gestão de classificações** | Manter tags e categorias da plataforma — **incluindo países e regiões** |
| **Importação em lote** | Carregar catálogo inicial de tecnologias (desejável após o núcleo) |
| **Indicadores (KPIs)** | Acompanhar uso, conexões e publicações |
| **Histórico de alterações** | Rastrear mudanças em conteúdos sensíveis (desejável) |
| **Configurações** | Limite mínimo de aderência, prazos de conexão, textos do sistema |

---

## 21. Como medir sucesso

O objetivo não é apenas **acesso à informação**, mas **conexão que leva à implementação**.

### Indicadores da entrega

| Indicador | O que mostra |
|---|---|
| Usuários registrados | Adesão à plataforma |
| Organizações verificadas | Base institucional confiável |
| Ofertas publicadas | Catálogo de soluções ativo |
| Demandas publicadas | Desafios reais na rede |
| Buscas realizadas | Uso da descoberta |
| Correspondências exibidas | Motor de match em ação |
| Conexões solicitadas | Intenção de colaborar |
| Conexões aceitas | Conexões efetivadas |
| Reuniões realizadas | Impacto intermediário (desejável) |
| Projetos formados | Impacto avançado (desejável) |
| Financiamento mobilizado | **Indicador estratégico** de longo prazo |

---

## 22. O que entra agora e o que fica para depois

### Marco 1 — entrega formal do núcleo navegável em 15/10

| Entrega | Descrição |
|---|---|
| Portal público | Home com banner, busca geral e **5 caminhos**; resultados com score e composição; páginas de solução, projeto e organização |
| Casos de sucesso | Vitrine curada com evidências e necessidades declaradas |
| Financiamento | **Ofertas ativas** (com auto-cadastro pela instituição) + **diretório** |
| Correspondência | Score percentual + explicação dos fatores + **3 caminhos** do match |
| Painel da organização | Conta, ofertas, desafios, conexões, itens salvos, gestão de perfil |
| Identidade e representação | Fluxo de 5 passos com validação e selo de verificado |
| Conexões | Solicitar sobre o item, aceitar, recusar, notificação por e-mail |
| Curadoria | Revisão e publicação de conteúdos, incluindo casos e ofertas |
| Indicadores básicos | Contadores no painel administrativo |
| Domínios editáveis | Países, regiões e demais classificações ajustáveis pelo admin |
| Catálogo demonstrativo | Volumes definidos em §25.2 |
| Hospedagem | Ambiente acessível para demonstração |

### Marco 2 — apresentação em novembro

| Entrega | Descrição |
|---|---|
| **Interface em inglês** | Funcional, com validação profissional dos textos |
| **Chatbot CAC** | Conversa sobre o mesmo núcleo de dados e devolve caminhos |
| **Versão local/offline** | Cópia operável sem internet, com conteúdo embarcado |
| **Marca configurável** | Nome e logo substituíveis sem alterar o sistema |
| Conteúdo curado | Catálogo demonstrativo revisado e narrativa fechada |
| Ensaio | Roteiro da apresentação testado de ponta a ponta |

### Desejável (se houver folga)

- Importação em lote de tecnologias
- Feedback "útil / não relevante" nas recomendações
- Histórico de buscas
- Recuperação de senha
- Exportação de resultados

### Depois de novembro — novo escopo

| Item | Descrição |
|---|---|
| **App mobile e WhatsApp** | Canais adicionais de acesso local (o chatbot web foi antecipado) |
| **Replicação avançada de casos** | Levar um caso validado para outros territórios de forma assistida |
| **Local → Global pleno** | Aprendizagem do território alimentando a base global automaticamente |
| **Chat interno** | Mensagens entre partes já conectadas |
| **Integração Sharm el-Sheikh** | Importação/sincronização de projetos UNFCCC |
| **Comparador de soluções** | Ver 2–3 tecnologias lado a lado |
| **Login institucional** | gov.br, SAML para governos |
| **Idiomas adicionais** | Espanhol, francês, árabe |
| **Políticas e iniciativas completas** | Camada institucional plena |
| **API aberta** | Para integrações externas e futuros canais |

> O encaminhamento pós-novembro (ONU ou evolução interna/Embrapa) definirá esse novo escopo. A arquitetura foi pensada para que a solução **continue aproveitável em qualquer dos dois cenários**.

---

## 23. Cronograma até a apresentação

**Início:** 02/09/2026 · **Núcleo navegável:** 15/10/2026 · **Apresentação:** novembro/2026 *(data a confirmar)*

O cronograma passou a ter **dois blocos**. O primeiro entrega o núcleo navegável; o segundo prepara a apresentação.

### Bloco A — núcleo navegável (setembro a 15/out)

| Fase | Período | Entrega visível |
|---|---|---|
| **1 — Fundação** | 02–06/set | Estrutura da plataforma, conta e login funcionando |
| **2 — Cadastros** | 09–13/set | Organizações, soluções, desafios, projetos e iniciativas podem ser criados |
| **3 — Portal público** | 16–20/set | Home com os **5 caminhos**, páginas de solução e organização |
| **4 — Busca e match** | 23–27/set | Busca com filtros, score, explicação e os **3 caminhos** do match |
| **5 — Conexões e curadoria** | 30/set – 04/out | Conexão sobre o item, e-mails, fila de curadoria, indicadores |
| **6 — Casos e financiamento** | 07–11/out | Casos de sucesso, ofertas ativas × diretório, representação institucional |
| **Fechamento** | 13–14/out | Conteúdo demonstrativo, hospedagem, ajustes, ensaio |
| **Marco 1** | **15/out** | **Entrega formal + demonstração ao cliente** do núcleo hospedado |

### Bloco B — preparação da apresentação (16/out a novembro)

| Fase | Período | Entrega visível |
|---|---|---|
| **7 — Inglês** | 16–24/out | Interface em inglês + tradução do conteúdo demonstrativo |
| **8 — Chatbot CAC** | 27/out – 07/nov | Conversa que interpreta o problema e devolve caminhos da base |
| **9 — Local/offline** | 10–14/nov | Cópia operável sem internet + marca configurável |
| **10 — Ensaio** | semana da apresentação | Conteúdo curado, revisão de textos, ensaio e congelamento |
| **Marco 2** | **novembro** | **Apresentação** |

### Marcos de validação (sextas-feiras)

| Data | O que deve estar funcionando |
|---|---|
| 06/set | Conta, login e estrutura básica |
| 13/set | Cadastro de soluções, desafios e projetos |
| 20/set | Portal navegável com os 5 caminhos |
| 27/set | Busca retornando scores e os 3 caminhos |
| 04/out | Conexão completa com notificação e curadoria |
| 11/out | Casos de sucesso e financiamento no ar |
| **15/out** | **Entrega formal:** núcleo navegável hospedado, demonstrado ao cliente |
| 24/out | Interface em inglês navegável |
| 07/nov | Chatbot respondendo sobre a base |
| 14/nov | Versão local/offline validada |

> **Alerta de capacidade.** O escopo acrescentado pela validação — casos de sucesso, ofertas ativas de financiamento, representação institucional, inglês funcional, chatbot e versão offline — **consumiu a folga** que existia no plano anterior. Os itens marcados como "desejáveis" (§22) só entram se houver sobra, e a data exata de novembro precisa ser confirmada para fechar o Bloco B.

---

## 24. Como será a demonstração

Há **duas demonstrações**, com o mesmo roteiro base:

| Quando | Natureza | Cobertura |
|---|---|---|
| **15/out** | Entrega formal ao cliente | Itens 1 a 10 — tudo em português |
| **novembro** | Apresentação institucional | Itens 1 a 11 — inclui chatbot, inglês e versão offline |

Roteiro previsto (**~20 minutos**), alinhado aos protótipos [v9](./_MATERIAIS/materiais%20finais/Climate_Action_Connect_Prototipo_Validacao_Daniel_v9.html) e [v13](./_MATERIAIS/materiais%20finais/Climate_Action_Connect_Preview_Site_Navegavel_v13_Consolidado.html):

| # | Onde | O que mostrar | Tempo |
|---|---|---|---|
| 1 | Portal | Home: banner, busca geral e os **5 caminhos** | 2 min |
| 2 | Portal | Busca *"recuperação de pastagens em seca"* → interpretação, filtros, resultados **94% / 89% / 83%** e a composição *128 = 48 + 28 + 30 + 22* | 4 min |
| 3 | Portal | Página da solução + **"Por que 94%?"** + informações complementares | 3 min |
| 4 | Portal | Os **3 caminhos** do match: quem pode resolver · quem pode financiar · projetos relacionados | 2 min |
| 5 | Portal | Financiamento: **oferta ativa** × **diretório** | 2 min |
| 6 | Portal | Caso de sucesso (Moçambique / captação de água de chuva): evidências e necessidades | 2 min |
| 7 | Painel | **Publicar um desafio** → receber correspondências | 2 min |
| 8 | Portal → Painel | *"Tenho interesse"* no item → identificação → solicitar conexão → ofertante aceita | 3 min |
| 9 | Portal | **Converse com a CAC**: relatar o problema e receber caminhos | 2 min |
| 10 | Admin | Fila de curadoria + indicadores + edição de domínios | 2 min |
| 11 | — | Alternar para **inglês** e mostrar a **versão local/offline** | 1 min |

**Narrativa central da demo:** partir de um **problema climático real**, encontrar **caminhos de ação ranqueados com transparência**, e **conectar pessoas e organizações** a um item concreto para agir.

**Hipótese que a demonstração precisa provar:** um desafio climático gera **caminhos úteis** de solução, projetos, organizações e financiamento — mesmo com um catálogo pequeno e curado.

---

## 25. Critérios para considerar a entrega pronta

### 25.1 Marco 1 — entrega formal em 15/out

Esta é a lista de **aceite da entrega**, demonstrada ao vivo na data. Estará pronto quando for possível:

- [ ] Entender a proposta ao entrar na home (banner + busca + **5 caminhos**)
- [ ] Navegar publicamente **sem login**, com o **perfil fora do menu**
- [ ] Buscar em linguagem natural e ver resultados com **score percentual**
- [ ] Ver a **composição do resultado** por tipo de conteúdo
- [ ] Combinar os **8 filtros**, com países e regiões completos
- [ ] Ver **por que** cada recomendação foi feita (fatores explicativos)
- [ ] Ver os **3 caminhos** do match — e **nenhuma** sugestão de "quem pode implementar"
- [ ] Navegar a **página completa** de uma solução, com informações complementares
- [ ] Ver **projetos, iniciativas e políticas** nos resultados
- [ ] Ver **financiamento** separado entre **oferta ativa** e **diretório**
- [ ] Uma instituição **cadastrar a própria oferta** de financiamento
- [ ] Abrir um **caso de sucesso** com evidências e necessidades declaradas
- [ ] **Publicar um desafio** e ver correspondências
- [ ] **Publicar e divulgar uma solução** (rascunho → curadoria → publicado)
- [ ] Concluir o fluxo de **representação institucional** e ver o selo de verificado
- [ ] **Favoritar/salvar** e **seguir** um item
- [ ] **Solicitar conexão sobre o item escolhido**, com objetivo declarado, e o ofertante receber notificação
- [ ] **Aceitar ou recusar** conexão, com aviso ao solicitante
- [ ] **Curador aprovar** conteúdo na fila de revisão
- [ ] **Administrador visualizar** indicadores e **editar domínios**
- [ ] Usar a plataforma em **celular, tablet e desktop**
- [ ] Acessar tudo isso em **ambiente hospedado**

### 25.2 Conteúdo demonstrativo

O objetivo é **provar valor sem depender de milhares de registros**:

| Conteúdo | Volume |
|---|---|
| Soluções | 10–15 |
| Projetos / iniciativas / políticas | 5–10 |
| Países / contextos demandantes | 3–5 |
| Desafios | 5–8 |
| Potenciais financiadores | 5–10 |
| Organizações | seleção curada |

### 25.3 Marco 2 — apresentação (novembro)

- [ ] **Interface em inglês** funcional, com textos validados profissionalmente
- [ ] **Chatbot CAC** respondendo sobre o mesmo núcleo de dados
- [ ] **Versão local/offline** executável sem internet
- [ ] **Nome e logo** substituíveis por configuração
- [ ] Catálogo demonstrativo revisado
- [ ] Ensaio da apresentação concluído

---

## 26. Decisões que ainda precisam ser tomadas

Prioridade: fechar primeiro a matriz da [§0.1](#01-apontamentos-do-cliente--manter-ou-acatar). Abaixo, o detalhamento operacional.

| # | Decisão | Opções | Por que importa |
|---|---|---|---|
| 1 | **Data exata da apresentação de novembro** | Informada pelo cliente — registrar no planejamento | Fecha o Bloco B do cronograma |
| 2 | **Fórmula e pesos do score** | Proposta atual vs. ajuste | Percepção de qualidade; a explicação já é obrigatória |
| 3 | **Lista final dos critérios de filtro** | Fechar os 8 critérios discutidos | Base para busca, cadastro e telas |
| 4 | **Escopo do chatbot CAC** | Interpretação simples vs. modelo de linguagem | Custo, prazo e risco de prometer além do entregável |
| 5 | **Como será a versão local/offline** | Pacote Docker offline vs. instalável | Esforço de preparação |
| 6 | Quem valida organizações | Embrapa, curador externo, automático parcial | Governança e confiança |
| 7 | Critérios de curadoria | Manual total vs. semi-automático | Carga operacional |
| 8 | Score mínimo aceitável na demonstração | 60% ou outro valor | Percepção de qualidade das recomendações |
| 9 | Hospedagem depois de novembro | Cloud genérica vs. infraestrutura Embrapa | Continuidade |
| 10 | Destinação final | ONU vs. evolução interna/Embrapa | Define o escopo pós-novembro |
| 11 | **Nav mobile: Perfil no rodapé?** | Seguir regra "perfil fora" vs. atalho mobile do protótipo | Consistência com a validação |
| 12 | **Voz no chatbot (🎙️)** | Só ilustrativo vs. fora da entrega | Expectativa vs. esforço |

### Decisões já encerradas em 02/09/2026

| Pergunta anterior | Resposta |
|---|---|
| Busca sem login? | **Sim, aberta.** A identificação entra só no contexto da ação |
| Financiadores: perfil básico ou completo? | **Ofertas ativas + diretório**, com auto-cadastro pela instituição |
| Conhecimento: transversal ou destacado? | **Os dois** — transversal na arquitetura e destacado como 5º caminho |
| Casos locais: agora ou depois? | **Agora**, como vitrine curada. A replicação avançada fica para depois |
| Idioma da interface | **PT como base, inglês funcional obrigatório** na apresentação |
| Jornada principal da demonstração | **Encontrar uma solução a partir da busca**, com os outros caminhos como complemento |
| Chatbot no pacote? | **Sim, até novembro**, com escopo técnico controlado |
| Entrega comercial = MVP técnico? | **Não.** Comercialmente é protótipo navegável; tecnicamente é **produto de alta performance** desde o início |

---

## 27. Riscos e premissas

### Premissas

- Equipe de desenvolvimento de **2 pessoas** em dedicação compatível com o prazo
- **Comercialmente** a entrega é dimensionada pelo recurso disponível; **tecnicamente** a fundação não é tratada como MVP descartável
- Conteúdo demonstrativo (soluções, projetos, desafios, financiadores) disponível para carga
- Definição de **quem faz a curadoria** durante a fase inicial
- **Versão congelada** dos protótipos v9 e v13 como referência única de experiência
- Hospedagem contratada e disponível durante o período da demonstração

### Riscos principais

| Risco | Mitigação |
|---|---|
| **Escopo acrescentado consumiu a folga** | Bloco B separado; itens desejáveis só entram com sobra; repriorização semanal |
| Cliente esperar "MVP frágil" e a equipe entregar além | Comunicar marcos comerciais; manter fundação sólida sem inflar features de superfície |
| Chatbot virar expectativa de IA avançada | Escopo declarado: interpreta e consulta a base, **sem prometer IA/ML sofisticado** |
| Inglês entregue sem qualidade | Reservar **validação profissional** dos textos antes da apresentação |
| Versão offline subestimada | Definir a estratégia até o Marco 1, não na última semana |
| Data de novembro não registrada nos documentos | Registrar o dia informado pelo cliente e fechar o Bloco B |
| **15/out é compromisso formal, sem buffer** | Ordem de sacrifício disparada na sexta seguinte a qualquer atraso de sprint |
| Governança indefinida (quem valida quem) | Fluxo manual com um curador na demonstração; regras documentadas |
| Catálogo pobre na demonstração | Volumes de §25.2 tratados como entregável, com curadoria de conteúdo |
| Reinterpretação da reunião | Versão congelada + este documento como referência única |
| Destinação final mudar | Configuração por ambiente; núcleo aproveitável em ONU ou Embrapa |

### Plano de contingência

1. Se houver atraso antes de 04/10, **priorizar a jornada da demonstração** (§24) e postergar os itens desejáveis (§22).
2. Se o Bloco B ficar apertado, a ordem de sacrifício é: **exportações e histórico → tradução automática de conteúdo (mantendo a interface em inglês) → profundidade do chatbot**.
3. **Não sacrificar:** busca com score explicável, os 5 caminhos, a conexão sobre o item, a versão local/offline e a **fundação técnica** (API única, contratos, i18n, deploy).

---

## Referências

| Documento | Público |
|---|---|
| [`requisitos.md`](./requisitos.md) | Especificação funcional completa |
| [`requisitos_dev.md`](./requisitos_dev.md) | Plano técnico de desenvolvimento (alta performance) |
| [`planejamento.md`](./planejamento.md) | Planejamento de execução e marcos |
| [Resumo da validação — 02/09/2026](./_MATERIAIS/materiais%20finais/Resumo_Visual_Validacao_Daniel_02-09-2026_ORDEM_DA_REUNIAO_v2_TRANSCRICAO.docx) | **Fonte normativa** desta versão |
| [Protótipo de validação v9](./_MATERIAIS/materiais%20finais/Climate_Action_Connect_Prototipo_Validacao_Daniel_v9.html) | Experiência validada + quadro do que entrou, saiu ou mudou |
| [Site navegável v13](./_MATERIAIS/materiais%20finais/Climate_Action_Connect_Preview_Site_Navegavel_v13_Consolidado.html) | Preview consolidado do site |
| [Startup Nation Central](https://startupnationcentral.org/) | Referência de mercado |
| Portal Sharm el-Sheikh (UNFCCC, COP27) | Contexto institucional |

> O protótipo v7 foi **superado** pelas versões v9 e v13 e não deve mais ser usado como referência.

---

*Documento v2.1 — validação 02/09/2026 + postura de produto (não MVP técnico). Para implementação, consultar [`requisitos_dev.md`](./requisitos_dev.md); para execução, [`planejamento.md`](./planejamento.md).*
