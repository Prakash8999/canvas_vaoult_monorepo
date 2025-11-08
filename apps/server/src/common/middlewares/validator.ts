import { Request, Response, NextFunction } from 'express';
import { ZodType, ZodError, infer as zInfer } from 'zod';
import { errorHandler } from './responseHandler';

// 🔹 Generic validator factory
function validateRequestPart<T extends ZodType<any, any>>(
  schema: T,
  part: 'body' | 'params' | 'query'
) {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    const result = schema.safeParse(req[part]);

    if (!result.success) {
      const formattedErrors = formatZodErrors(result.error);
      errorHandler(res, 'Validation failed', formattedErrors, 400);
      return;
    }

    // Apply parsed + typed data
    (req as any)[part] = result.data;
    next();
  };
}

// 🔹 Error formatter (production-friendly)
function formatZodErrors(error: ZodError) {
  return error.issues.map(issue => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
}

// 🔹 Convenience wrappers (typed)
export function validateBody<T extends ZodType<any, any>>(schema: T) {
  return validateRequestPart(schema, 'body') as (
    req: Request<unknown, unknown, zInfer<T>>,
    res: Response,
    next: NextFunction
  ) => void;
}

export function validateParams<T extends ZodType<any, any>>(schema: T) {
  return validateRequestPart(schema, 'params') as (
    req: Request<zInfer<T>>,
    res: Response,
    next: NextFunction
  ) => void;
}

export function validateQuery<T extends ZodType<any, any>>(schema: T) {
  return validateRequestPart(schema, 'query') as (
    req: Request<unknown, unknown, unknown, zInfer<T>>,
    res: Response,
    next: NextFunction
  ) => void;
}
