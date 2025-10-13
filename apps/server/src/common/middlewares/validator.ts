import { NextFunction } from 'express-serve-static-core';
import { Request, Response } from 'express';
import { errorHandler } from './responseHandler';
import { ZodSchema } from 'zod/v3';

//validateBody as production ready
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // console.log('Validating body:', req.body);
    const result = schema.safeParse(req.body);
    console.log("result in parse", result);
    if (!result.success) {
      const formattedErrors = result.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }));
      errorHandler(
        res, 
        'Validation failed',
        formattedErrors,
        400
      );
      return;
    }
    req.body = result.data;
    next();
  };
}
//validateParams as production ready
export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      const formattedErrors = result.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }));
      errorHandler(
        res,
        'Validation failed',
        formattedErrors,
        400
      );
      return;
    }
    req.params = result.data as import('express-serve-static-core').ParamsDictionary;
    next();
  };
}