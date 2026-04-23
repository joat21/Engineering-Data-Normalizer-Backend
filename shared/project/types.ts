import z from "zod";
import {
  createProjectSchema,
  exportProjectToExcelSchema,
  getProjectByIdSchema,
  projectBodySchema,
  updateProjectSchema,
  upsertProjectItemSchema,
} from "./schemas";

export type Project = z.infer<typeof projectBodySchema> & {
  id: string;
  isArchived: boolean;
};

export type ProjectItem = {
  id: string;
  equipmentId: string;
  amount: number;
  name: string | null;
  manufacturerName: string | null;
  supplierName: string | null;
  article: string | null;
  model: string | null;
  externalCode: string | null;
  price: string;
  priceInRub: string;
};

export type ProjectDetails = Project & {
  items: ProjectItem[];
};

export type CreateProjectBody = z.infer<typeof createProjectSchema.shape.body>;

export type GetProjectDetailsParams = z.infer<
  typeof getProjectByIdSchema.shape.params
>;

export type ExportProjectToExcelParams = z.infer<
  typeof exportProjectToExcelSchema.shape.params
>;

export type UpdateProjectParams = z.infer<
  typeof updateProjectSchema.shape.params
>;
export type UpdateProjectBody = z.infer<typeof updateProjectSchema.shape.body>;

export type UpsertProjectItemParams = z.infer<
  typeof upsertProjectItemSchema.shape.params
>;
export type UpsertProjectItemBody = z.infer<
  typeof upsertProjectItemSchema.shape.body
>;
