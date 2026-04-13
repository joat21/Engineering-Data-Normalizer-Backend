import z from "zod";
import {
  createProjectSchema,
  projectBodySchema,
  upsertProjectItemSchema,
} from "./schemas";

export type Project = z.infer<typeof projectBodySchema> & {
  id: string;
  isArchived: boolean;
};

export type CreateProjectBody = z.infer<typeof createProjectSchema.shape.body>;

export type UpsertProjectItemParams = z.infer<
  typeof upsertProjectItemSchema.shape.params
>;
export type UpsertProjectItemBody = z.infer<
  typeof upsertProjectItemSchema.shape.body
>;
