import { tokenize } from './score.js';

export type Interpretation = {
  challenge: string;
  context: string;
  sector: string;
  intent: string;
};

type Lang = 'pt' | 'en' | 'es';

function pick(lang: Lang, pt: string, en: string, es: string) {
  if (lang === 'en') return en;
  if (lang === 'es') return es;
  return pt;
}

/** Rule-based interpretation — no LLM required. */
export function interpretQuery(query: string, lang: Lang = 'pt'): Interpretation {
  const tokens = new Set(tokenize(query));
  const has = (...words: string[]) => words.some((w) => tokens.has(w));

  const drought = has('seca', 'drought', 'arid', 'semiarido', 'semi', 'sequia', 'sequía');
  const pasture = has('pastagem', 'pastagens', 'pasto', 'pasture', 'pecuaria', 'pastizal', 'pastizales');
  const water = has('agua', 'hidrico', 'water', 'irrigacao', 'hídrica', 'hidrica');
  const funding = has('financiamento', 'funding', 'fundo', 'credito', 'financiamiento', 'crédito');
  const agroforest = has('agrofloresta', 'agroflorestal', 'agroforestry', 'agroforesteria', 'agroforestería');

  let challenge = pick(lang, 'desafio climático', 'climate challenge', 'desafío climático');
  if (drought) challenge = pick(lang, 'seca', 'drought', 'sequía');
  else if (water) challenge = pick(lang, 'segurança hídrica', 'water security', 'seguridad hídrica');
  else if (funding) challenge = pick(lang, 'acesso a financiamento', 'access to finance', 'acceso a financiamiento');

  let context = pick(
    lang,
    'sistemas produtivos territoriais',
    'territorial production systems',
    'sistemas productivos territoriales',
  );
  if (pasture) context = pick(lang, 'pastagens', 'pastures', 'pastizales');
  else if (agroforest) context = pick(lang, 'agroflorestas', 'agroforestry', 'agroforestería');
  else if (water) context = pick(lang, 'comunidades rurais', 'rural communities', 'comunidades rurales');

  let sector = pick(lang, 'agricultura', 'agriculture', 'agricultura');
  if (pasture) sector = pick(lang, 'agricultura/pecuária', 'agriculture/livestock', 'agricultura/ganadería');
  else if (agroforest) sector = pick(lang, 'florestas/agricultura', 'forests/agriculture', 'bosques/agricultura');

  let intent = pick(lang, 'encontrar caminhos de ação', 'find paths of action', 'encontrar caminos de acción');
  if (funding) intent = pick(lang, 'encontrar financiamento', 'find funding', 'encontrar financiamiento');

  if (!query.trim()) {
    return {
      challenge: pick(lang, 'exploração aberta', 'open exploration', 'exploración abierta'),
      context: pick(lang, 'catálogo completo', 'full catalogue', 'catálogo completo'),
      sector: pick(lang, 'ação climática', 'climate action', 'acción climática'),
      intent: pick(lang, 'navegar conteúdos publicados', 'browse published content', 'navegar contenidos publicados'),
    };
  }

  return { challenge, context, sector, intent };
}
