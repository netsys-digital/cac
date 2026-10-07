import { resolveMediaUrl } from './mediaUrl';
import { plainText } from './richText';

type CardSource = {
  title: string;
  summary?: string | null;
  coverImageUrl?: string | null;
  cardTitle?: string | null;
  cardSummary?: string | null;
  cardImageUrl?: string | null;
};

/** Dados do card de chamada, com fallback em título, resumo e imagem representativa. */
export function callCard(item: CardSource) {
  return {
    title: item.cardTitle?.trim() || item.title,
    summary: item.cardSummary?.trim() || plainText(item.summary),
    image: resolveMediaUrl(item.cardImageUrl || item.coverImageUrl),
  };
}
