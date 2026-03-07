import { z } from "zod";

export const initImportSchema = z.object({
  body: z.object({
    categoryId: z.uuid(),
  }),
});

export const importRowsSchema = z.object({
  body: z.object({
    sessionId: z.uuid(),
    rows: z.array(z.array(z.string().or(z.number()))),
  }),
});
