/**
 * Expansão do seed aos volumes do requisito-final.md §12 (Marco 1 / E6).
 * Chamado após o catálogo base — idempotente via upsert por slug.
 */
import {
  ClimateAction,
  ContentStatus,
  Maturity,
  NeedType,
  PrismaClient,
  ProjectType,
} from '@prisma/client';

export async function upsertDemoVolumes(prisma: PrismaClient, orgIds: Record<string, string>) {
  // Orgs adicionais (contextos BR, MZ, KE, CO)
  const extraOrgs = [
    {
      slug: 'iitamz',
      name: 'IITA Moçambique',
      summary: 'Extensão do IITA com foco em sistemas alimentares e água em Moçambique.',
      country: 'MZ',
      region: 'africa',
      website: 'https://www.iita.org',
    },
    {
      slug: 'cgiar-climate',
      name: 'CGIAR Climate Hub',
      summary: 'Hub de conhecimento climático para agricultura em países tropicais.',
      country: 'KE',
      region: 'africa',
      website: 'https://www.cgiar.org',
    },
    {
      slug: 'agrosavia',
      name: 'AGROSAVIA',
      summary: 'Corporación colombiana de investigación agropecuaria.',
      country: 'CO',
      region: 'south_america',
      website: 'https://www.agrosavia.co',
    },
  ] as const;

  for (const org of extraOrgs) {
    const row = await prisma.organization.upsert({
      where: { slug: org.slug },
      create: { ...org, verificationStatus: 'VERIFIED' },
      update: {
        name: org.name,
        summary: org.summary,
        country: org.country,
        region: org.region,
        website: org.website,
        verificationStatus: 'VERIFIED',
      },
    });
    orgIds[org.slug] = row.id;
  }

  const extraTechs = [
    {
      slug: 'biochar-solos-tropicais',
      title: 'Biochar para solos tropicais degradados',
      summary: 'Uso de biochar para melhorar retenção de água e carbono em solos agrícolas.',
      problemStatement: 'Solos degradados perdem carbono e capacidade de retenção hídrica.',
      howItWorks: 'Produção local de biochar, aplicação calibrada e monitoramento de indicadores.',
      organizationId: orgIds.embrapa,
      country: 'BR',
      region: 'south_america',
      climateAction: ClimateAction.BOTH,
      maturity: Maturity.VALIDATION,
      tags: ['solo', 'carbono', 'biochar'],
    },
    {
      slug: 'irrigacao-gotas-sahel',
      title: 'Irrigação por gotejamento de baixo custo',
      summary: 'Kits de irrigação para hortas familiares em zonas semiáridas.',
      problemStatement: 'Perdas por evaporação em irrigação por inundação.',
      howItWorks: 'Tubulação simples, filtros locais e calendário de irrigação.',
      organizationId: orgIds.iita,
      country: 'NE',
      region: 'africa',
      climateAction: ClimateAction.ADAPTATION,
      maturity: Maturity.READY_FOR_IMPLEMENTATION,
      tags: ['água', 'irrigação', 'horticultura'],
    },
    {
      slug: 'seguro-indexado-seca',
      title: 'Seguro indexado climática para seca',
      summary: 'Instrumento financeiro baseado em índices de precipitação.',
      problemStatement: 'Produtores sem proteção contra anos de seca extrema.',
      howItWorks: 'Índice satelital dispara indenização automática via parceiros locais.',
      organizationId: orgIds['cgiar-climate'],
      country: 'KE',
      region: 'africa',
      climateAction: ClimateAction.ADAPTATION,
      maturity: Maturity.DEMONSTRATION,
      tags: ['financiamento', 'seguro', 'seca'],
    },
    {
      slug: 'integracao-lavoura-pecuaria',
      title: 'Integração lavoura-pecuária-floresta',
      summary: 'Sistemas ILPF para intensificação sustentável.',
      problemStatement: 'Expansão de pastagens em áreas de vegetação nativa.',
      howItWorks: 'Rotação, sombreamento e forrageiras melhoradas.',
      organizationId: orgIds.embrapa,
      country: 'BR',
      region: 'south_america',
      climateAction: ClimateAction.BOTH,
      maturity: Maturity.AT_SCALE,
      tags: ['ilpf', 'pastagem', 'mitigação'],
    },
    {
      slug: 'compostagem-comunitaria',
      title: 'Compostagem comunitária rural',
      summary: 'Organização comunitária para reciclagem de resíduos orgânicos.',
      problemStatement: 'Resíduos orgânicos sem aproveitamento e solos pobres.',
      howItWorks: 'Unidades comunitárias, treinamento e distribuição de composto.',
      organizationId: orgIds.agrosavia,
      country: 'CO',
      region: 'south_america',
      climateAction: ClimateAction.MITIGATION,
      maturity: Maturity.DEMONSTRATION,
      tags: ['solo', 'comunidade', 'resíduos'],
    },
  ] as const;

  for (const tech of extraTechs) {
    const { tags, ...data } = tech;
    await prisma.technology.upsert({
      where: { slug: tech.slug },
      create: {
        ...data,
        status: ContentStatus.PUBLISHED,
        tags: { create: tags.map((tag) => ({ tag })) },
      },
      update: {
        ...data,
        status: ContentStatus.PUBLISHED,
        tags: { deleteMany: {}, create: tags.map((tag) => ({ tag })) },
      },
    });
  }

  const extraChallenges = [
    {
      slug: 'perda-solo-amazonia',
      title: 'Controle de erosão em áreas de transição',
      summary: 'Precisamos de práticas para estabilizar solos em encostas produtivas.',
      context: 'Comunidades com pressão de expansão agrícola.',
      needType: NeedType.TECHNOLOGY,
      organizationId: orgIds.embrapa,
      country: 'BR',
      region: 'south_america',
      tags: ['solo', 'erosão'],
    },
    {
      slug: 'acesso-mercado-hortas-mz',
      title: 'Acesso a mercado para hortas irrigadas em MZ',
      summary: 'Buscamos parceria comercial e logística para escoamento da produção.',
      context: 'Hortas com captação de chuva sem canais de venda estáveis.',
      needType: NeedType.PARTNERSHIP,
      organizationId: orgIds.iitamz,
      country: 'MZ',
      region: 'africa',
      tags: ['mercado', 'horticultura', 'moçambique'],
    },
    {
      slug: 'capacitacao-extensao-sahel',
      title: 'Capacitação de extensionistas no Sahel',
      summary: 'Necessidade de materiais e treinamento em práticas de seca.',
      context: 'Rede de extensionistas com baixa atualização técnica.',
      needType: NeedType.TRAINING,
      organizationId: orgIds.iita,
      country: 'NE',
      region: 'africa',
      tags: ['capacitação', 'extensão'],
    },
  ] as const;

  for (const challenge of extraChallenges) {
    const { tags, ...data } = challenge;
    await prisma.challenge.upsert({
      where: { slug: challenge.slug },
      create: {
        ...data,
        status: ContentStatus.PUBLISHED,
        tags: { create: tags.map((tag) => ({ tag })) },
      },
      update: {
        ...data,
        status: ContentStatus.PUBLISHED,
        tags: { deleteMany: {}, create: tags.map((tag) => ({ tag })) },
      },
    });
  }

  const extraProjects = [
    {
      slug: 'politica-pastagens-br',
      title: 'Política nacional de pastagens resilientes',
      type: ProjectType.POLICY,
      summary: 'Marco de incentivo à recuperação de pastagens degradadas.',
      organizationId: orgIds.embrapa,
      country: 'BR',
      region: 'south_america',
    },
    {
      slug: 'iniciativa-agua-sahel',
      title: 'Iniciativa água e solos no Sahel',
      type: ProjectType.INITIATIVE,
      summary: 'Rede multi-país de práticas de retenção hídrica.',
      organizationId: orgIds.iita,
      country: 'NE',
      region: 'africa',
    },
    {
      slug: 'programa-ilpf-cerrado',
      title: 'Programa ILPF Cerrado',
      type: ProjectType.PROGRAMME,
      summary: 'Escalonamento de integração lavoura-pecuária-floresta.',
      organizationId: orgIds.embrapa,
      country: 'BR',
      region: 'south_america',
    },
    {
      slug: 'projeto-hortas-maputo',
      title: 'Projeto hortas periurbanas Maputo',
      type: ProjectType.PROJECT,
      summary: 'Fortalecimento de hortas com captação de chuva na periferia de Maputo.',
      organizationId: orgIds.iitamz,
      country: 'MZ',
      region: 'africa',
    },
  ] as const;

  for (const project of extraProjects) {
    await prisma.project.upsert({
      where: { slug: project.slug },
      create: { ...project, status: ContentStatus.PUBLISHED },
      update: { ...project, status: ContentStatus.PUBLISHED },
    });
  }

  const funders = [
    {
      slug: 'fundo-verde-clima-br',
      name: 'Fundo Verde Clima Brasil',
      summary: 'Diretório de referência para adaptação agrícola no Brasil.',
      country: 'BR',
      region: 'south_america',
      organizationId: orgIds.embrapa,
    },
    {
      slug: 'africa-climate-fund',
      name: 'Africa Climate Fund',
      summary: 'Perfil de financiador com foco em resiliência hídrica na África.',
      country: 'KE',
      region: 'africa',
      organizationId: orgIds['cgiar-climate'],
    },
    {
      slug: 'latam-agro-finance',
      name: 'LatAm Agro Finance',
      summary: 'Diretório de instituições que apoiam transição agroecológica.',
      country: 'CO',
      region: 'south_america',
      organizationId: orgIds.agrosavia,
    },
    {
      slug: 'eu-dev-coop',
      name: 'EU Dev Cooperation Desk',
      summary: 'Perfil de cooperação europeia para agricultura tropical.',
      country: 'FR',
      region: 'europe',
      organizationId: orgIds.cirad,
    },
  ] as const;

  for (const f of funders) {
    await prisma.funderProfile.upsert({
      where: { slug: f.slug },
      create: { ...f, status: ContentStatus.PUBLISHED },
      update: { ...f, status: ContentStatus.PUBLISHED },
    });
  }

  const deadline = new Date();
  deadline.setMonth(deadline.getMonth() + 6);
  const offers = [
    {
      slug: 'chamada-agua-sahel-2026',
      title: 'Chamada água e solos Sahel 2026',
      summary: 'Oferta ativa para práticas de retenção hídrica e extensão.',
      whatFunds: 'Captação, armazenamento e capacitação',
      criteria: 'Organizações com presença no Sahel',
      amountRange: 'EUR 80k–200k',
      officialUrl: 'https://example.org/agua-sahel-2026',
      deadline,
      country: 'NE',
      region: 'africa',
      organizationId: orgIds.iita,
    },
    {
      slug: 'chamada-ilpf-cerrado',
      title: 'Chamada ILPF Cerrado',
      summary: 'Financiamento para adoção de ILPF em propriedades familiares.',
      whatFunds: 'Assistência técnica e implantação',
      criteria: 'Propriedades no Cerrado brasileiro',
      amountRange: 'BRL 100k–400k',
      officialUrl: 'https://example.org/ilpf-cerrado',
      deadline,
      country: 'BR',
      region: 'south_america',
      organizationId: orgIds.embrapa,
    },
    {
      slug: 'chamada-hortas-mz',
      title: 'Chamada hortas resilientes Moçambique',
      summary: 'Oferta ativa alinhada a casos de captação de chuva e horticultura.',
      whatFunds: 'Cisternas, kits e comercialização',
      criteria: 'Cooperativas e ONGs em MZ',
      amountRange: 'USD 40k–120k',
      officialUrl: 'https://example.org/hortas-mz',
      deadline,
      country: 'MZ',
      region: 'africa',
      organizationId: orgIds.iitamz,
    },
  ] as const;

  for (const offer of offers) {
    await prisma.fundingOffer.upsert({
      where: { slug: offer.slug },
      create: { ...offer, status: ContentStatus.PUBLISHED },
      update: { ...offer, status: ContentStatus.PUBLISHED },
    });
  }

  const cases = [
    {
      slug: 'ilpf-fazenda-piloto-go',
      title: 'ILPF em fazenda piloto em Goiás',
      summary: 'Caso de intensificação sustentável com redução de emissões e recuperação de pastagem.',
      context: 'Fazenda familiar com pastagem degradada e baixa produtividade.',
      outcomes: 'Aumento de lotação animal e sequestro de carbono documentado.',
      country: 'BR',
      region: 'south_america',
      organizationId: orgIds.embrapa,
      needs: [
        { needType: NeedType.FUNDING, detail: 'Crédito para expansão' },
        { needType: NeedType.TRAINING, detail: 'Capacitação de vizinhos' },
      ],
      evidence: ['Inventário de carbono', 'Relatório de produtividade'],
    },
    {
      slug: 'cisternas-sahel-comunitarias',
      title: 'Cisternas comunitárias no Sahel',
      summary: 'Caso de segurança hídrica com gestão comunitária da água.',
      context: 'Vilas com escassez sazonal e alta variabilidade de chuvas.',
      outcomes: 'Meses adicionais de disponibilidade de água para hortas.',
      country: 'NE',
      region: 'africa',
      organizationId: orgIds.iita,
      needs: [
        { needType: NeedType.EQUIPMENT, detail: 'Materiais de construção' },
        { needType: NeedType.PARTNERSHIP, detail: 'Governos locais' },
      ],
      evidence: ['Monitoramento de volume', 'Pesquisa de percepção'],
    },
  ] as const;

  for (const c of cases) {
    await prisma.successCase.upsert({
      where: { slug: c.slug },
      create: {
        title: c.title,
        slug: c.slug,
        summary: c.summary,
        context: c.context,
        outcomes: c.outcomes,
        country: c.country,
        region: c.region,
        organizationId: c.organizationId,
        status: ContentStatus.PUBLISHED,
        needs: { create: c.needs },
        media: {
          create: c.evidence.map((caption, idx) => ({
            url: `evidence://${c.slug}/${idx + 1}`,
            kind: 'PDF' as const,
            filename: `${c.slug}-${idx + 1}.pdf`,
            mimeType: 'application/pdf',
            size: 1000 + idx * 100,
            caption,
          })),
        },
      },
      update: {
        title: c.title,
        summary: c.summary,
        context: c.context,
        outcomes: c.outcomes,
        country: c.country,
        region: c.region,
        organizationId: c.organizationId,
        status: ContentStatus.PUBLISHED,
        needs: { deleteMany: {}, create: c.needs },
        media: {
          deleteMany: {},
          create: c.evidence.map((caption, idx) => ({
            url: `evidence://${c.slug}/${idx + 1}`,
            kind: 'PDF' as const,
            filename: `${c.slug}-${idx + 1}.pdf`,
            mimeType: 'application/pdf',
            size: 1000 + idx * 100,
            caption,
          })),
        },
      },
    });
  }

  const counts = {
    orgs: await prisma.organization.count(),
    technologies: await prisma.technology.count({ where: { status: ContentStatus.PUBLISHED } }),
    challenges: await prisma.challenge.count({ where: { status: ContentStatus.PUBLISHED } }),
    projects: await prisma.project.count({ where: { status: ContentStatus.PUBLISHED } }),
    funders: await prisma.funderProfile.count({ where: { status: ContentStatus.PUBLISHED } }),
    offers: await prisma.fundingOffer.count({ where: { status: ContentStatus.PUBLISHED } }),
    cases: await prisma.successCase.count({ where: { status: ContentStatus.PUBLISHED } }),
  };
  console.log('[seed] §12 volumes', counts);
  return counts;
}
