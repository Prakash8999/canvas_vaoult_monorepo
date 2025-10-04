// utils/errorParser.ts
import { ZodError } from "zod";
import { ValidationError as SequelizeValidationError } from "sequelize";

export function parseError(err: any): { message: string; statusCode: number } {
  // Zod validation error
  if (err instanceof ZodError) {
    const message = err.issues?.[0]?.message || "Invalid input data";
    return { message, statusCode: 400 };
  }

  // Sequelize validation error
  if (err instanceof SequelizeValidationError) {
    const message = err.errors?.[0]?.message || "Database validation failed";
    return { message, statusCode: 400 };
  }

  // Custom error (manually thrown)
  if (err.statusCode && err.message) {
    return { message: err.message, statusCode: err.statusCode };
  }

  // Default fallback
  return { message: err.message || "Internal Server Error", statusCode: 500 };
}