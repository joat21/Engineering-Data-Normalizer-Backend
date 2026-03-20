import { RequestHandler } from "express";
import slugify from "slugify";
import {
  createProjectSchema,
  deleteProjectItemSchema,
  exportProjectToExcelSchema,
  getProjectByIdSchema,
  updateItemAmountSchema,
  updateProjectSchema,
  upsertProjectItemSchema,
} from "../schemas/project";
import {
  createProject,
  deleteProjectItem,
  exportProjectToExcel,
  getProjectById,
  getProjects,
  updateItemAmount,
  updateProject,
  upsertProjectItem,
} from "../services/ProjectService";
import { HandlerFromSchema } from "../types/zod";

export const createProjectHandler: HandlerFromSchema<
  typeof createProjectSchema
> = async (req, res, next) => {
  try {
    await createProject(req.body);

    res.sendStatus(201);
  } catch (error) {
    next(error);
  }
};

export const getProjectsHandler: RequestHandler = async (_req, res, next) => {
  try {
    const projects = await getProjects();

    res.json(projects);
  } catch (error) {
    next(error);
  }
};

export const getProjectByIdHandler: HandlerFromSchema<
  typeof getProjectByIdSchema
> = async (req, res, next) => {
  try {
    const project = await getProjectById(req.params.id);
    res.json(project);
  } catch (error) {
    next(error);
  }
};

export const updateProjectHandler: HandlerFromSchema<
  typeof updateProjectSchema
> = async (req, res, next) => {
  try {
    const result = await updateProject(req.params.id, req.body);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const exportProjectToExcelHandler: HandlerFromSchema<
  typeof exportProjectToExcelSchema
> = async (req, res, next) => {
  try {
    const { projectName, buffer } = await exportProjectToExcel(req.params.id);
    const fileName = `${slugify(projectName, "_")}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    return res.send(buffer);
  } catch (error) {
    next(error);
  }
};

export const upsertProjectItemHandler: HandlerFromSchema<
  typeof upsertProjectItemSchema
> = async (req, res, next) => {
  try {
    const result = await upsertProjectItem(req.params.projectId, req.body);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const updateItemAmountHandler: HandlerFromSchema<
  typeof updateItemAmountSchema
> = async (req, res, next) => {
  try {
    const result = await updateItemAmount(req.params.id, req.body.amount);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const deleteProjectItemHandler: HandlerFromSchema<
  typeof deleteProjectItemSchema
> = async (req, res, next) => {
  try {
    await deleteProjectItem(req.params.id);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};
