import { NextFunction, Request, Response } from "express";

import jwt from "jsonwebtoken";
import { AuthenticatedUser } from "../../types/authInterface";
import { User } from "../../../modules/users/users.model";
import { authLogger } from "../../utils/authLogger";
import { errorHandler } from "../responseHandler";
import redisClient from "apps/server/src/config/redis";
import { redisKey } from "../../utils/redisKey";


// Helper function to validate JWT secret
const validateJwtSecret = (): string => {
	const secret = process.env.JWT_SECRET;
	if (!secret) {
		throw new Error("JWT_SECRET environment variable is not defined");
	}
	if (secret.length < 32) {
		console.warn("JWT_SECRET should be at least 32 characters long for security");
	}
	return secret;
};

// Helper function to extract token from headers
const extractToken = (req: Request): string | null => {
	// Check Authorization header first (standard)
	const authHeader = req.header('Authorization');
	if (authHeader && authHeader.startsWith('Bearer ')) {
		return authHeader.slice(7);
	}

	// Fallback to custom x-auth-token header
	const customHeader = req.header('x-auth-token');
	if (customHeader) {
		return customHeader.startsWith('Bearer ') ? customHeader.slice(7) : customHeader;
	}

	return null;
};

// Helper function to get user from cache or database
const getUserById = async (userId: number): Promise<any | null> => {


	try {
		const user = await User.findOne({
			where: {
				id: userId,
				block: false,
			},
			attributes: ['id', 'email', 'name', 'is_email_verified', 'profile_url', 'created_at'],
		});


		return user?.dataValues || null;
	} catch (error) {
		console.error('Database error in getUserById:', error);
		return null;
	}
};

export const authUser = async (req: Request, res: Response, next: NextFunction) => {

	const rawToken = req.cookies?.refresh_token;
	if (!rawToken) {
		errorHandler(res, "Authentication token not found", {}, 401);
		return;
	}

	// const tokenHash = hashToken(rawToken);
	// const now = new Date();
	// const session = await AuthToken.findOne({
	// 	where: {
	// 		token_hash: tokenHash, revoked: false, expires_at: { [Op.gt]: now },
	// 	}
	// });
	// if (!session) {
	// 	errorHandler(res, "Invalid authentication token", {}, 401);
	// 	return;
	// }

	const xForwardedFor = req.headers['x-forwarded-for'];
	const clientIP =
		req.ip ||
		(typeof xForwardedFor === 'string'
			? xForwardedFor.split(',')[0].trim()
			: undefined) ||
		'unknown';
	const userAgent = req.get('User-Agent') || 'unknown';

	try {
		// Extract token from headers
		const token = extractToken(req);
		if (!token) {
			authLogger.log({
				action: 'LOGIN_FAILED',
				ip: clientIP,
				userAgent,
				url: req.url,
				method: req.method,
				error: 'No token provided'
			});
			errorHandler(res, "Authentication token not found", {}, 401);
			return;
		}
		console.log('Extracted Token:', token);

		// Validate token format (basic check)
		if (token.length < 10) {
			authLogger.log({
				action: 'TOKEN_INVALID',
				ip: clientIP,
				userAgent,
				url: req.url,
				method: req.method,
				error: 'Invalid token format'
			});
			errorHandler(res, "Invalid token format", {}, 401);
			return;
		}

		// Verify JWT token
		let decoded: AuthenticatedUser;
		try {
			const jwtSecret = validateJwtSecret();
			console.log('Validating token...', jwtSecret);
			decoded = jwt.verify(token, jwtSecret, {
				issuer: 'canvas-backend',
				audience: 'canvas-users',
				// Add clock tolerance for minor time differences
				clockTolerance: 30, // 30 seconds
			}) as AuthenticatedUser;
		} catch (error: any) {
			console.error('JWT verification error:', error);
			// Enhanced error handling with more specific messages
			const action = error.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID';
			authLogger.log({
				action,
				ip: clientIP,
				userAgent,
				url: req.url,
				method: req.method,
				error: error.message
			});

			switch (error.name) {
				case 'TokenExpiredError':
					errorHandler(res, "Token has expired. Please login again", {}, 401);
					break;
				case 'JsonWebTokenError':
					errorHandler(res, "Invalid token signature", {}, 401);
					break;
				case 'NotBeforeError':
					errorHandler(res, "Token not active yet", {}, 401);
					break;
				default:
					console.error('JWT verification error:', error);
					errorHandler(res, "Token verification failed", {}, 401);
			}
			return;
		}

		// Validate decoded token structure
		if (!decoded.userId || !decoded.email) {
			authLogger.log({
				action: 'TOKEN_INVALID',
				ip: clientIP,
				userAgent,
				url: req.url,
				method: req.method,
				error: 'Invalid token payload'
			});
			errorHandler(res, "Invalid token payload", {}, 401);
			return;
		}




		const key = redisKey("session", decoded.userId, decoded.deviceId, decoded.jti);
		const tokenExists = await redisClient.get(key);

		if (!tokenExists) {
			errorHandler(res, "Access token invalid or revoked", {}, 401);

			return
		}
		// Get user from database with caching
		const userData = await getUserById(decoded.userId);
		if (!userData) {
			authLogger.log({
				action: 'USER_NOT_FOUND',
				userId: decoded.userId.toString(),
				email: decoded.email,
				ip: clientIP,
				userAgent,
				url: req.url,
				method: req.method,
				error: 'User not found or disabled'
			});
			errorHandler(res, "User not found or has been disabled", {}, 401);
			return;
		}

		// Additional security check: verify email matches
		if (userData.email !== decoded.email) {
			authLogger.log({
				action: 'TOKEN_INVALID',
				userId: decoded.userId.toString(),
				email: decoded.email,
				ip: clientIP,
				userAgent,
				url: req.url,
				method: req.method,
				error: `Email mismatch: token=${decoded.email}, db=${userData.email}`
			});
			errorHandler(res, "Token validation failed", {}, 401);
			return;
		}
		// Attach user data to request object
		req.user = {
			userId: decoded.userId,
			email: decoded.email,
			isEmailVerified: userData.is_email_verified,
			name: userData.name,
			deviceId: decoded.deviceId,
			jti: decoded.jti,
			profileUrl: userData.profile_url,
			iat: decoded.iat,
			exp: decoded.exp,
		};

		// Log successful authentication
		authLogger.log({
			action: 'LOGIN_SUCCESS',
			userId: decoded.userId.toString(),
			email: decoded.email,
			ip: clientIP,
			userAgent,
			url: req.url,
			method: req.method
		});

		next();
	} catch (error: any) {
		// Log error for debugging but don't expose internal details
		authLogger.log({
			action: 'AUTH_ERROR',
			userId: req.user?.userId.toString(),
			ip: clientIP,
			userAgent,
			url: req.url,
			method: req.method,
			error: error.message
		});

		console.error('Auth middleware error:', {
			error: error.message,
			stack: error.stack,
			userId: req.user?.userId,
			url: req.url,
			method: req.method,
		});

		errorHandler(res, "Authentication failed", {}, 500);
		return;
	}
};

