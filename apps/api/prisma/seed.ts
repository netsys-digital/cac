import {
  ClimateAction,
  ContentStatus,
  Maturity,
  NeedType,
  PrismaClient,
  ProjectType,
  UserRole,
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ISO_COUNTRIES } from './data/countries.js';
import { REGIONS } from './data/regions.js';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../../');
dotenv.config({ path: path.join(repoRoot, '.env') });
dotenv.config();

const prisma = new PrismaClient();

const taxonomy: Array<{
  grouping: string;
  key: string;
  labelPt: string;
  labelEn: string;
  sortOrder: number;
}> = [
  { grouping: 'content_type', key: 'solution', labelPt: 'Solução', labelEn: 'Solution', sortOrder: 1 },
  { grouping: 'content_type', key: 'project', labelPt: 'Projeto', labelEn: 'Project', sortOrder: 2 },
  { grouping: 'content_type', key: 'initiative', labelPt: 'Iniciativa', labelEn: 'Initiative', sortOrder: 3 },
  { grouping: 'content_type', key: 'policy', labelPt: 'Política', labelEn: 'Policy', sortOrder: 4 },
  { grouping: 'content_type', key: 'programme', labelPt: 'Programa', labelEn: 'Programme', sortOrder: 5 },
  { grouping: 'content_type', key: 'organization', labelPt: 'Organização', labelEn: 'Organization', sortOrder: 6 },
  { grouping: 'content_type', key: 'funder', labelPt: 'Financiador', labelEn: 'Funder', sortOrder: 7 },
  { grouping: 'content_type', key: 'success_case', labelPt: 'Caso de sucesso', labelEn: 'Success case', sortOrder: 8 },
  { grouping: 'maturity', key: 'RESEARCH', labelPt: 'Pesquisa', labelEn: 'Research', sortOrder: 1 },
  { grouping: 'maturity', key: 'VALIDATION', labelPt: 'Validação', labelEn: 'Validation', sortOrder: 2 },
  { grouping: 'maturity', key: 'DEMONSTRATION', labelPt: 'Demonstração', labelEn: 'Demonstration', sortOrder: 3 },
  {
    grouping: 'maturity',
    key: 'READY_FOR_IMPLEMENTATION',
    labelPt: 'Pronta para implementação',
    labelEn: 'Ready for implementation',
    sortOrder: 4,
  },
  { grouping: 'maturity', key: 'AT_SCALE', labelPt: 'Em escala', labelEn: 'At scale', sortOrder: 5 },
  { grouping: 'need_type', key: 'TECHNOLOGY', labelPt: 'Tecnologia', labelEn: 'Technology', sortOrder: 1 },
  { grouping: 'need_type', key: 'KNOWLEDGE', labelPt: 'Conhecimento', labelEn: 'Knowledge', sortOrder: 2 },
  { grouping: 'need_type', key: 'PARTNERSHIP', labelPt: 'Parceria', labelEn: 'Partnership', sortOrder: 3 },
  { grouping: 'need_type', key: 'FUNDING', labelPt: 'Financiamento', labelEn: 'Funding', sortOrder: 4 },
  { grouping: 'need_type', key: 'TRAINING', labelPt: 'Capacitação', labelEn: 'Training', sortOrder: 5 },
  { grouping: 'need_type', key: 'RESEARCH', labelPt: 'Pesquisa', labelEn: 'Research', sortOrder: 6 },
  { grouping: 'need_type', key: 'EQUIPMENT', labelPt: 'Equipamento', labelEn: 'Equipment', sortOrder: 7 },
  ...REGIONS.map((r) => ({ grouping: 'region' as const, ...r })),
  ...ISO_COUNTRIES.map((c) => ({ grouping: 'country' as const, ...c })),
];

async function upsertDomains() {
  for (const domain of taxonomy) {
    await prisma.domain.upsert({
      where: { grouping_key: { grouping: domain.grouping, key: domain.key } },
      create: domain,
      update: {
        labelPt: domain.labelPt,
        labelEn: domain.labelEn,
        sortOrder: domain.sortOrder,
      },
    });
  }
}

async function upsertAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@cac.local';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!';
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      name: 'CAC Admin',
      role: UserRole.ADMIN,
    },
    update: {
      passwordHash,
      name: 'CAC Admin',
      role: UserRole.ADMIN,
    },
  });

  const curatorEmail = process.env.SEED_CURATOR_EMAIL ?? 'curador@cac.local';
  const curatorHash = await bcrypt.hash(process.env.SEED_CURATOR_PASSWORD ?? 'Curador123!', 10);
  await prisma.user.upsert({
    where: { email: curatorEmail },
    create: {
      email: curatorEmail,
      passwordHash: curatorHash,
      name: 'CAC Curador',
      role: UserRole.CURADOR,
    },
    update: {
      passwordHash: curatorHash,
      role: UserRole.CURADOR,
    },
  });
}

/** Seed parcial E2 — conteúdo publicado para product-pages e demo. */
async function upsertCatalog() {
  const orgs = [
    {
      slug: 'embrapa',
      name: 'Embrapa',
      summary: 'Empresa Brasileira de Pesquisa Agropecuária — inovação para a agricultura tropical.',
      country: 'BR',
      region: 'south_america',
      website: 'https://www.embrapa.br',
    },
    {
      slug: 'iita',
      name: 'IITA',
      summary: 'International Institute of Tropical Agriculture — soluções para sistemas alimentares na África.',
      country: 'NG',
      region: 'africa',
      website: 'https://www.iita.org',
    },
    {
      slug: 'cirad',
      name: 'CIRAD',
      summary: 'Centro de cooperação internacional em pesquisa agronômica para o desenvolvimento.',
      country: 'FR',
      region: 'europe',
      website: 'https://www.cirad.fr',
    },
  ] as const;

  const orgIds: Record<string, string> = {};
  for (const org of orgs) {
    const row = await prisma.organization.upsert({
      where: { slug: org.slug },
      create: {
        ...org,
        verificationStatus: 'VERIFIED',
      },
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

  const technologies = [
    {
      slug: 'recuperacao-pastagens-seca',
      title: 'Solução para recuperação de pastagens em condições de seca',
      summary:
        'Pacote de práticas e tecnologias para recuperar pastagens degradadas sob estresse hídrico.',
      problemStatement:
        'Pastagens degradadas em regiões de seca perdem produtividade e aumentam a pressão sobre novas áreas.',
      howItWorks:
        'Combina espécies forrageiras resilientes, manejo rotacionado, correção de solo e monitoramento remoto para guiar a restauração.',
      organizationId: orgIds.embrapa,
      country: 'BR',
      region: 'south_america',
      climateAction: ClimateAction.ADAPTATION,
      maturity: Maturity.READY_FOR_IMPLEMENTATION,
      tags: ['pastagem', 'seca', 'adaptação', 'pecuária', 'recuperação'],
    },
    {
      slug: 'manejo-hidrico-pequenos-produtores',
      title: 'Prática de conservação de água e solo',
      summary: 'Técnicas de captação e uso eficiente da água em propriedades familiares e conservação de solo.',
      problemStatement: 'Escassez hídrica reduz a segurança alimentar de comunidades rurais.',
      howItWorks: 'Integra cisternas, irrigação de baixo custo e calendário de cultivo adaptado à sazonalidade.',
      organizationId: orgIds.embrapa,
      country: 'BR',
      region: 'south_america',
      climateAction: ClimateAction.ADAPTATION,
      maturity: Maturity.DEMONSTRATION,
      tags: ['água', 'agricultura familiar', 'seca', 'solo'],
    },
    {
      slug: 'agrofloresta-resiliente',
      title: 'Sistemas agroflorestais resilientes',
      summary: 'Arranjos produtivos que combinam árvores, cultivos e conservação de solo.',
      problemStatement: 'Monoculturas expõem produtores a choques climáticos e perda de biodiversidade.',
      howItWorks: 'Desenho de consórcios, sucessão ecológica e acompanhamento de indicadores de resiliência.',
      organizationId: orgIds.cirad,
      country: 'BR',
      region: 'south_america',
      climateAction: ClimateAction.BOTH,
      maturity: Maturity.AT_SCALE,
      tags: ['agrofloresta', 'biodiversidade', 'mitigação'],
    },
    {
      slug: 'variedades-tolerantes-seca',
      title: 'Variedades tolerantes à seca',
      summary: 'Cultivares adaptadas a regimes irregulares de chuva em zonas tropicais.',
      problemStatement: 'Cultivos tradicionais falham em anos de seca prolongada.',
      howItWorks: 'Seleção participativa, ensaios multilocal e disseminação com assistência técnica.',
      organizationId: orgIds.iita,
      country: 'NG',
      region: 'africa',
      climateAction: ClimateAction.ADAPTATION,
      maturity: Maturity.VALIDATION,
      tags: ['sementes', 'seca', 'segurança alimentar'],
    },
    {
      slug: 'monitoramento-solo-remoto',
      title: 'Monitoramento remoto de solo e pastagem',
      summary: 'Indicadores satelitais e de campo para decisão de manejo em tempo quase real.',
      problemStatement: 'Falta de informação impede intervenção precoce na degradação.',
      howItWorks: 'Integra imagens, sensores e alertas simples via aplicativo ou painel web.',
      organizationId: orgIds.cirad,
      country: 'FR',
      region: 'europe',
      climateAction: ClimateAction.BOTH,
      maturity: Maturity.DEMONSTRATION,
      tags: ['monitoramento', 'dados', 'pastagem'],
    },
  ] as const;

  for (const tech of technologies) {
    const { tags, ...data } = tech;
    await prisma.technology.upsert({
      where: { slug: tech.slug },
      create: {
        ...data,
        status: ContentStatus.PUBLISHED,
        tags: { create: tags.map((tag) => ({ tag })) },
      },
      update: {
        title: data.title,
        summary: data.summary,
        problemStatement: data.problemStatement,
        howItWorks: data.howItWorks,
        organizationId: data.organizationId,
        country: data.country,
        region: data.region,
        climateAction: data.climateAction,
        maturity: data.maturity,
        status: ContentStatus.PUBLISHED,
        tags: {
          deleteMany: {},
          create: tags.map((tag) => ({ tag })),
        },
      },
    });
  }

  const challenges = [
    {
      slug: 'seca-pastagens-cerrado',
      title: 'Recuperação de pastagens sob seca no Cerrado',
      summary: 'Precisamos de soluções para recuperar áreas degradadas com baixa disponibilidade hídrica.',
      context: 'Municípios do interior com pecuária familiar e acesso limitado a assistência técnica.',
      needType: NeedType.TECHNOLOGY,
      organizationId: orgIds.embrapa,
      country: 'BR',
      region: 'south_america',
      tags: ['seca', 'pastagem', 'cerrado'],
    },
    {
      slug: 'seguranca-hidrica-sahel',
      title: 'Segurança hídrica para comunidades no Sahel',
      summary: 'Buscamos práticas e tecnologias de captação e armazenamento de água.',
      context: 'Comunidades rurais com chuvas irregulares e alta variabilidade climática.',
      needType: NeedType.KNOWLEDGE,
      organizationId: orgIds.iita,
      country: 'NE',
      region: 'africa',
      tags: ['água', 'sahel', 'adaptação'],
    },
    {
      slug: 'financiamento-agroflorestas',
      title: 'Financiamento para transição agroflorestal',
      summary: 'Procuramos instrumentos financeiros adequados à conversão de sistemas produtivos.',
      context: 'Cooperativas interessadas em agroflorestas com necessidade de capital de giro.',
      needType: NeedType.FUNDING,
      organizationId: orgIds.cirad,
      country: 'BR',
      region: 'south_america',
      tags: ['financiamento', 'agrofloresta'],
    },
  ] as const;

  for (const challenge of challenges) {
    const { tags, ...data } = challenge;
    await prisma.challenge.upsert({
      where: { slug: challenge.slug },
      create: {
        ...data,
        status: ContentStatus.PUBLISHED,
        tags: { create: tags.map((tag) => ({ tag })) },
      },
      update: {
        title: data.title,
        summary: data.summary,
        context: data.context,
        needType: data.needType,
        organizationId: data.organizationId,
        country: data.country,
        region: data.region,
        status: ContentStatus.PUBLISHED,
        tags: {
          deleteMany: {},
          create: tags.map((tag) => ({ tag })),
        },
      },
    });
  }

  const projects = [
    {
      slug: 'rede-pastagens-resilientes',
      title: 'Projeto de manejo adaptativo de pastagens',
      type: ProjectType.INITIATIVE,
      summary:
        'Articulação de produtores, pesquisa e extensão para escalar recuperação de pastagens sob seca e resiliência de solo e vegetação.',
      organizationId: orgIds.embrapa,
      country: 'BR',
      region: 'south_america',
    },
    {
      slug: 'programa-sementes-climaticas',
      title: 'Programa sementes climáticas',
      type: ProjectType.PROGRAMME,
      summary: 'Disseminação de variedades tolerantes à seca com assistência técnica local.',
      organizationId: orgIds.iita,
      country: 'NG',
      region: 'africa',
    },
  ] as const;

  for (const project of projects) {
    await prisma.project.upsert({
      where: { slug: project.slug },
      create: { ...project, status: ContentStatus.PUBLISHED },
      update: {
        title: project.title,
        type: project.type,
        summary: project.summary,
        organizationId: project.organizationId,
        country: project.country,
        region: project.region,
        status: ContentStatus.PUBLISHED,
      },
    });
  }

  await prisma.funderProfile.upsert({
    where: { slug: 'fundo-clima-agricultura' },
    create: {
      name: 'Fundo Clima Agricultura',
      slug: 'fundo-clima-agricultura',
      summary: 'Perfil de financiador com foco em adaptação agrícola e recuperação de paisagens produtivas.',
      country: 'BR',
      region: 'south_america',
      organizationId: orgIds.embrapa,
      status: ContentStatus.PUBLISHED,
    },
    update: {
      name: 'Fundo Clima Agricultura',
      summary: 'Perfil de financiador com foco em adaptação agrícola e recuperação de paisagens produtivas.',
      country: 'BR',
      region: 'south_america',
      organizationId: orgIds.embrapa,
      status: ContentStatus.PUBLISHED,
    },
  });

  const deadline = new Date();
  deadline.setMonth(deadline.getMonth() + 4);
  await prisma.fundingOffer.upsert({
    where: { slug: 'chamada-pastagens-resilientes-2026' },
    create: {
      title: 'Chamada pastagens resilientes 2026',
      slug: 'chamada-pastagens-resilientes-2026',
      summary: 'Oferta ativa para projetos de recuperação de pastagens e resiliência hídrica em pecuária.',
      whatFunds: 'Recuperação de pastagens, manejo hídrico e assistência técnica em pecuária familiar.',
      criteria: 'Organizações com atuação em adaptação climática na América do Sul ou África.',
      amountRange: 'USD 50k–250k',
      officialUrl: 'https://example.org/chamada-pastagens-2026',
      deadline,
      country: 'BR',
      region: 'south_america',
      organizationId: orgIds.cirad,
      status: ContentStatus.PUBLISHED,
    },
    update: {
      title: 'Chamada pastagens resilientes 2026',
      summary: 'Oferta ativa para projetos de recuperação de pastagens e resiliência hídrica em pecuária.',
      whatFunds: 'Recuperação de pastagens, manejo hídrico e assistência técnica em pecuária familiar.',
      criteria: 'Organizações com atuação em adaptação climática na América do Sul ou África.',
      amountRange: 'USD 50k–250k',
      officialUrl: 'https://example.org/chamada-pastagens-2026',
      deadline,
      country: 'BR',
      region: 'south_america',
      organizationId: orgIds.cirad,
      status: ContentStatus.PUBLISHED,
    },
  });

  await prisma.successCase.upsert({
    where: { slug: 'captacao-chuva-horticultura-mocambique' },
    create: {
      title: 'Captação de chuva para horticultura em Moçambique',
      slug: 'captacao-chuva-horticultura-mocambique',
      summary:
        'Comunidades rurais em Moçambique combinaram cisternas, manejo de solo e hortas comunitárias para reduzir a insegurança alimentar sob seca.',
      context:
        'Distritos com chuvas irregulares e limitada infraestrutura hídrica. Famílias dependiam de cultivo de sequeiro com perdas frequentes.',
      outcomes:
        'Aumento da produção hortícola na estação seca, maior retenção de água no solo e documentação de práticas replicáveis para extensão rural.',
      country: 'MZ',
      region: 'africa',
      organizationId: orgIds.iita,
      status: ContentStatus.PUBLISHED,
      needs: {
        create: [
          { needType: NeedType.FUNDING, detail: 'Capital para expansão de cisternas comunitárias' },
          { needType: NeedType.PARTNERSHIP, detail: 'Parceiros de extensão e comercialização local' },
          { needType: NeedType.EQUIPMENT, detail: 'Kits de irrigação de baixo custo' },
        ],
      },
      media: {
        create: [
          {
            url: 'evidence://mz/baseline',
            kind: 'PDF',
            filename: 'baseline-agua.pdf',
            mimeType: 'application/pdf',
            size: 1200,
            caption: 'Linha de base hídrica e produtiva antes da intervenção',
          },
          {
            url: 'evidence://mz/resultados',
            kind: 'PDF',
            filename: 'resultados-horticultura.pdf',
            mimeType: 'application/pdf',
            size: 1800,
            caption: 'Evidências de produção e retenção de água após 18 meses',
          },
        ],
      },
    },
    update: {
      title: 'Captação de chuva para horticultura em Moçambique',
      summary:
        'Comunidades rurais em Moçambique combinaram cisternas, manejo de solo e hortas comunitárias para reduzir a insegurança alimentar sob seca.',
      context:
        'Distritos com chuvas irregulares e limitada infraestrutura hídrica. Famílias dependiam de cultivo de sequeiro com perdas frequentes.',
      outcomes:
        'Aumento da produção hortícola na estação seca, maior retenção de água no solo e documentação de práticas replicáveis para extensão rural.',
      country: 'MZ',
      region: 'africa',
      organizationId: orgIds.iita,
      status: ContentStatus.PUBLISHED,
      needs: {
        deleteMany: {},
        create: [
          { needType: NeedType.FUNDING, detail: 'Capital para expansão de cisternas comunitárias' },
          { needType: NeedType.PARTNERSHIP, detail: 'Parceiros de extensão e comercialização local' },
          { needType: NeedType.EQUIPMENT, detail: 'Kits de irrigação de baixo custo' },
        ],
      },
      media: {
        deleteMany: {},
        create: [
          {
            url: 'evidence://mz/baseline',
            kind: 'PDF',
            filename: 'baseline-agua.pdf',
            mimeType: 'application/pdf',
            size: 1200,
            caption: 'Linha de base hídrica e produtiva antes da intervenção',
          },
          {
            url: 'evidence://mz/resultados',
            kind: 'PDF',
            filename: 'resultados-horticultura.pdf',
            mimeType: 'application/pdf',
            size: 1800,
            caption: 'Evidências de produção e retenção de água após 18 meses',
          },
        ],
      },
    },
  });

  // Itens na fila do curador (demo de decisão com observações)
  await prisma.technology.upsert({
    where: { slug: 'biochar-pequenos-produtores-review' },
    create: {
      slug: 'biochar-pequenos-produtores-review',
      title: 'Biochar para pequenos produtores (em revisão)',
      summary:
        'Proposta de fornos de baixo custo para produzir biochar e melhorar retenção de carbono e água em solos degradados.',
      problemStatement: 'Solos pobres e perda de fertilidade sob clima irregular.',
      howItWorks: 'Treinamento local, fornos metálicos simples e protocolo de aplicação em hortas.',
      organizationId: orgIds.embrapa,
      country: 'BR',
      region: 'south_america',
      climateAction: ClimateAction.BOTH,
      maturity: Maturity.VALIDATION,
      status: ContentStatus.IN_REVIEW,
      tags: { create: [{ tag: 'solo' }, { tag: 'mitigação' }] },
    },
    update: {
      title: 'Biochar para pequenos produtores (em revisão)',
      summary:
        'Proposta de fornos de baixo custo para produzir biochar e melhorar retenção de carbono e água em solos degradados.',
      status: ContentStatus.IN_REVIEW,
      curationNote: null,
      reviewedAt: null,
    },
  });

  await prisma.challenge.upsert({
    where: { slug: 'alerta-cheia-comunitario-review' },
    create: {
      slug: 'alerta-cheia-comunitario-review',
      title: 'Sistema comunitário de alerta de cheias (em revisão)',
      summary: 'Buscamos parceiros para implantar alertas simples em bacias com risco de inundação.',
      context: 'Comunidades ribeirinhas com pouco acesso a sensores e internet estável.',
      needType: NeedType.TECHNOLOGY,
      organizationId: orgIds.iita,
      country: 'NG',
      region: 'africa',
      status: ContentStatus.IN_REVIEW,
      tags: { create: [{ tag: 'alerta' }, { tag: 'adaptação' }] },
    },
    update: {
      title: 'Sistema comunitário de alerta de cheias (em revisão)',
      summary: 'Buscamos parceiros para implantar alertas simples em bacias com risco de inundação.',
      status: ContentStatus.IN_REVIEW,
      curationNote: null,
      reviewedAt: null,
    },
  });

  console.log(
    `[seed] catalog orgs=${orgs.length} technologies=${technologies.length} challenges=${challenges.length} projects=${projects.length} funders=1 offers=1 cases=1 (+2 IN_REVIEW for curator)`,
  );

  const { upsertDemoVolumes } = await import('./seed-demo-volumes.js');
  await upsertDemoVolumes(prisma, orgIds);
}

async function main() {
  await upsertDomains();
  await upsertAdmin();
  await upsertCatalog();
  const { reindexAllPublished } = await import('../src/lib/embeddings/indexer.js');
  const indexed = await reindexAllPublished();
  console.log(`[seed] domains=${taxonomy.length} (countries=${ISO_COUNTRIES.length}) embeddings=${indexed}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
