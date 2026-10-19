import { z } from 'zod';

export const applicationPlaceSchema = z.object({
  country: z.string().length(2),
  region: z.string().min(2).max(64).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

export const applicationPlacesField = {
  applicationPlaces: z.array(applicationPlaceSchema).max(300).optional(),
};

export type ApplicationPlace = z.infer<typeof applicationPlaceSchema>;
