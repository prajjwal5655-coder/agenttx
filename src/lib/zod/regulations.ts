import { z } from "zod";

export const CitationSchema = z.object({
  ref: z.string().regex(/^[a-z-]+:.+$/),
  article: z.string(),
  summary: z.string(),
  applicability: z.string(),
  verified: z.boolean(),
});

export const RegulationSchema = z.object({
  id: z.string(),
  title: z.string(),
  descriptions: z.string().array(),
  citations: CitationSchema.array(),
});
