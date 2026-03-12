import z from "zod";

export const saveFromStagingSchema = z.object({
  body: z.object({
    sessionId: z.uuid(),
  }),
});

export const stringFilterValueSchema = z.array(z.string());
export const booleanFilterValueSchema = z.boolean();
export const numericFilterValueSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  options: z.array(z.string()).optional(),
});

export const filterValueSchema = z.union([
  numericFilterValueSchema,
  stringFilterValueSchema,
  booleanFilterValueSchema,
]);

export const getEquipmentTableSchema = z.object({
  query: z.object({
    categoryId: z.uuid(),
  }),
  body: z.object({
    query: z.record(z.string(), filterValueSchema),
  }),
});
