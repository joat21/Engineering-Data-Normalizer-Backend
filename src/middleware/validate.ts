import { RequestHandler } from "express";
import { ZodType } from "zod";

export const validate =
  (schema: ZodType): RequestHandler =>
  (req, res, next) => {
    const result = schema.safeParse({
      params: req.params,
      body: req.body,
      query: req.query,
    });

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid data",
        errors: result.error.issues,
      });
    }

    const { params, body, query } = result.data as any;

    if (params) req.params = params;
    if (body) req.body = body;
    if (query) req.query = query;

    next();
  };
