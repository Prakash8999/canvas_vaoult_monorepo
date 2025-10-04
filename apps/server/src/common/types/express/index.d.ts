import { Request } from "express";
import { AuthenticatedUser } from "../authInterface";

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}