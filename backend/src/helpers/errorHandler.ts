import { NextFunction, Request, Response } from "express";
import { ApiError } from "../exceptions/api-error";

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  console.error("[Error]", err);

  if (err instanceof ApiError) {
    return res.status(err.status).json({
      message: err.message,
    });
  }

  res.status(500).json({
    message: "Internal Server Error. Please try again later",
  });
};
