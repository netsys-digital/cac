function nullableText(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return String(value).trim() || null;
}

/** Campos editáveis do card de chamada (a imagem vai por upload em /:kind/:id/card-image). */
export function callCardData(body: Record<string, unknown>) {
  return {
    cardTitle: nullableText(body.cardTitle),
    cardSummary: nullableText(body.cardSummary),
  };
}
