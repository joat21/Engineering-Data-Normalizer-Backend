import { z } from "zod";
import { SourceType } from "./types";

export const initImportSchema = z.object({
  body: z.object({
    categoryId: z.uuid(),
    sourceType: z.enum(SourceType),
    manufacturerId: z.string().optional(),
    supplierId: z.string().optional(),
    currencyId: z.string(),
    originHeader: z.preprocess((val) => {
      if (typeof val === "string") {
        try {
          return JSON.parse(val);
        } catch {
          return val;
        }
      }
      return val;
    }, z.array(z.string()).optional()),
  }),
});

export const importRowsSchema = z.object({
  params: z.object({ sessionId: z.uuid() }),
  body: z.object({
    rows: z.array(z.array(z.string().or(z.number()))),
  }),
});

export const getStagingTableSchema = z.object({
  params: z.object({ sessionId: z.uuid() }),
});

export const deleteStagingItemsSchema = z.object({
  body: z.object({
    ids: z.array(z.uuid()),
  }),
});
