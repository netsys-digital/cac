import { z } from 'zod';
import { TEXT_LIMITS } from './limits.js';

/** Card de chamada: sobrescreve título/resumo/imagem nos destaques e listagens. */
export const callCardFields = {
  cardTitle: z.string().max(TEXT_LIMITS.cardTitle).optional().nullable(),
  cardSummary: z.string().max(TEXT_LIMITS.cardSummary).optional().nullable(),
};

export const highlightTypeSchema = z.enum(['SOLUTION', 'FUNDING_OFFER', 'SUCCESS_CASE']);

export const updateHighlightsBodySchema = z.object({
  items: z
    .array(
      z.object({
        type: highlightTypeSchema,
        id: z.string().uuid(),
      }),
    )
    .max(12),
});

export type HighlightType = z.infer<typeof highlightTypeSchema>;
export type UpdateHighlightsBody = z.infer<typeof updateHighlightsBodySchema>;
