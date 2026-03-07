import { Request, Response, NextFunction } from "express";
import { z, ZodType } from "zod";

type InferSchema<T extends ZodType> = z.infer<T>;

type Body<T extends ZodType> =
  InferSchema<T> extends { body: infer B } ? B : {};

type Params<T extends ZodType> =
  InferSchema<T> extends { params: infer P } ? P : {};

type Query<T extends ZodType> =
  InferSchema<T> extends { query: infer Q } ? Q : {};

type RequestFromSchema<T extends ZodType> = Request<
  Params<T>,
  any,
  Body<T>,
  Query<T>
>;

export type HandlerFromSchema<T extends ZodType> = (
  req: RequestFromSchema<T>,
  res: Response,
  next: NextFunction,
) => any;
