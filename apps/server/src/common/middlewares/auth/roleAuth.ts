import { NextFunction, Request, Response } from "express";
import { errorHandler } from "../responseHandler";

// Role-based authorization middleware
// This should be used AFTER the authUser middleware
export const requireRole = (allowedRoles: string[] = []) => {
	return (req: Request, res: Response, next: NextFunction): void => {
		// Check if user is authenticated first
		if (!req.user) {
			errorHandler(res, "Authentication required", {}, 401);
			return;
		}

		// If no roles specified, just check if user is authenticated
		if (allowedRoles.length === 0) {
			next();
			return;
		}

		// Check if user has required role (when you add role field to User model)
		// For now, this is a placeholder since the User model doesn't have a role field
		// You can uncomment and modify this when you add roles to your User model

		/*
		const userRole = req.user.role || 'user';
		if (!allowedRoles.includes(userRole)) {
			errorHandler(res, "Insufficient permissions", {}, 403);
			return;
		}
		*/

		// For now, allow all authenticated users
		next();
	};
};

// Convenience middleware for admin-only routes
export const requireAdmin = requireRole(['admin']);

// Convenience middleware for verified email users only
export const requireEmailVerified = (req: Request, res: Response, next: NextFunction): void => {
	if (!req.user) {
		errorHandler(res, "Authentication required", {}, 401);
		return;
	}

	if (!req.user.isEmailVerified) {
		errorHandler(res, "Email verification required", {}, 403);
		return;
	}

	next();
};