import { z } from "zod";
import {
  booleanFilterValueSchema,
  filterValueSchema,
  numericFilterValueSchema,
  stringFilterValueSchema,
  createEquipmentSchema,
  createEquipmentFromStagingSchema,
  getEquipmentTableSchema,
  getEquipmentDetailsSchema,
} from "./schemas";
import type { MappingTargetType } from "../normalization";

export type CreateEquipmentBody = z.infer<
  typeof createEquipmentSchema.shape.body
>;

export type CreateEquipmentFromStagingQuery = z.infer<
  typeof createEquipmentFromStagingSchema.shape.query
>;

export type NumericFilterValue = z.infer<typeof numericFilterValueSchema>;
export type StringFilterValue = z.infer<typeof stringFilterValueSchema>;
export type BooleanFilterValue = z.infer<typeof booleanFilterValueSchema>;
export type FilterValue = z.infer<typeof filterValueSchema>;

export interface EquipmentHeader {
  key: string;
  label: string;
  unit?: string | null;
  type: MappingTargetType;
}

export interface EquipmentRow {
  id: string;
  [key: string]: string | number | boolean | null;
}

export interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EquipmentTableResponse {
  headers: EquipmentHeader[];
  rows: EquipmentRow[];
  pagination: PaginationData;
}

export type GetEquipmentTableQuery = z.infer<
  typeof getEquipmentTableSchema.shape.query
>;
export type EquipmentTableQuery = GetEquipmentTableQuery;

export type GetEquipmentDetailsParams = z.infer<
  typeof getEquipmentDetailsSchema.shape.params
>;

export interface EquipmentDetailResponse {
  id: string;
  name: string | null;
  source: {
    fileName: string;
    url: string;
    uploadedAt: Date;
  };
  systemFields: Array<{
    label: string;
    value: string | null;
  }>;
  attributes: Array<{
    label: string;
    value: string;
    unit: string | null;
  }>;
}
