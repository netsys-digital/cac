import { z } from 'zod';

/** Card de chamada: sobrescreve título/resumo/imagem nos destaques e listagens. */
export const callCardFields = {
  cardTitle: z.string().max(200).optional().nullable(),
  cardSummary: z.string().max(400).optional().nullable(),
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
