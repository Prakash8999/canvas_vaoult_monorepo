// src/middleware/responseHandler.ts
import { Response } from "express";
import { error, success } from "../utils/responseStructure";

export const successHandler = <T>(
  res: Response,
  message: string,
  results: T,
  statusCode: number,
  meta?: any
) => {
  return res.status(statusCode).json(success<T>(message, results, statusCode, meta));
};

export const errorHandler = (res: Response, message: string, err: any, statusCode: number) => {
  return res.status(statusCode).json(error(message, statusCode, err));
};