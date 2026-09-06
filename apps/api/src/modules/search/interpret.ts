import { tokenize } from './score.js';

export type Interpretation = {
  challenge: string;
  context: string;
  sector: string;
  intent: string;
};

/** Rule-based interpretation — no LLM required. */
export function interpretQuery(query: string, lang: 'pt' | 'en' = 'pt'): Interpretation {
  const tokens = new Set(tokenize(query));
  const has = (...words: string[]) => words.some((w) => tokens.has(w));

  const drought = has('seca', 'drought', 'arid', 'semiarido', 'semi');
  const pasture = has('pastagem', 'pastagens', 'pasto', 'pasture', 'pecuaria');
  const water = has('agua', 'hidrico', 'water', 'irrigacao');
  const funding = has('financiamento', 'funding', 'fundo', 'credito');
  const agroforest = has('agrofloresta', 'agroflorestal', 'agroforestry');

  let challenge = lang === 'en' ? 'climate challenge' : 'desafio climático';
  if (drought) challenge = lang === 'en' ? 'drought' : 'seca';
  else if (water) challenge = lang === 'en' ? 'water security' : 'segurança hídrica';
  else if (funding) challenge = lang === 'en' ? 'access to finance' : 'acesso a financiamento';

  let context = lang === 'en' ? 'territorial production systems' : 'sistemas produtivos territoriais';
  if (pasture) context = lang === 'en' ? 'pastures' : 'pastagens';
  else if (agroforest) context = lang === 'en' ? 'agroforestry' : 'agroflorestas';
  else if (water) context = lang === 'en' ? 'rural communities' : 'comunidades rurais';

  let sector = lang === 'en' ? 'agriculture' : 'agricultura';
  if (pasture) sector = lang === 'en' ? 'agriculture/livestock' : 'agricultura/pecuária';
  else if (agroforest) sector = lang === 'en' ? 'forests/agriculture' : 'florestas/agricultura';

  let intent =
    lang === 'en' ? 'find paths of action' : 'encontrar caminhos de ação';
  if (funding) intent = lang === 'en' ? 'find funding' : 'encontrar financiamento';

  if (!query.trim()) {
    return {
      challenge: lang === 'en' ? 'open exploration' : 'exploração aberta',
      context: lang === 'en' ? 'full catalogue' : 'catálogo completo',
      sector: lang === 'en' ? 'climate action' : 'ação climática',
      intent: lang === 'en' ? 'browse published content' : 'navegar conteúdos publicados',
    };
  }

  return { challenge, context, sector, intent };
}
