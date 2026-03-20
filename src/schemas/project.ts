import z from "zod";

const projectBody = z.object({
  name: z.string().min(1),
  description: z.string(),
});

export const createProjectSchema = z.object({
  body: projectBody,
});

export const getProjectByIdSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
});

export const updateProjectSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
  body: projectBody.partial().extend({
    isArchived: z.boolean().optional(),
  }),
});

export const exportProjectToExcelSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
});

export const upsertProjectItemSchema = z.object({
  params: z.object({
    projectId: z.uuid(),
  }),
  body: z.object({
    equipmentId: z.uuid(),
    amount: z.number().int().positive(),
  }),
});

export const updateItemAmountSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
  body: z.object({
    amount: z.number().int().positive(),
  }),
});

export const deleteProjectItemSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
