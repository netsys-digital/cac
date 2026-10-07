/**
 * Limites de texto compartilhados por API e painel. Generosos de propósito: devem acomodar
 * conteúdo completo e só barrar abuso (as colunas são TEXT no Postgres).
 */
export const TEXT_LIMITS = {
  /** Títulos de publicações, organizações e anexos. */
  title: 300,
  /** Resumos / apresentações. */
  summary: 10000,
  /** Campos descritivos longos (problema, como funciona, contexto, resultados, critérios…). */
  longText: 50000,
  /** Textos complementares (instituições parceiras, acesso, interesse…). */
  mediumText: 20000,
  /** Campos curtos livres (faixa de valores, unidade responsável, bioma, estados…). */
  shortText: 1000,
  /** Card de chamada (destaques e listagens). */
  cardTitle: 300,
  cardSummary: 2000,
  /** Galeria e outros documentos. */
  attachmentTitle: 300,
  attachmentDescription: 5000,
  /** Mensagens, justificativas e notas. */
  message: 10000,
  evidenceNote: 5000,
} as const;
