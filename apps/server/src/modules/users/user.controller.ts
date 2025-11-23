import { Request, Response } from 'express';
import User, { CreateUserSchema, UserLoginSchema, UserOtpVerifySchema, ForgotPasswordSchema, ResetPasswordWithOtpSchema, ResetPasswordWithTokenSchema, UpdateUserSchema } from './users.model';
import { successHandler, errorHandler } from '../../common/middlewares/responseHandler';
import { parseError } from '../../common/utils/error.parser';
import * as userService from './user.service';
import { clearRefreshTokenCookie, findValidRefreshSession, generateAccessToken, revokeRefreshSession, rotateRefreshToken, setRefreshTokenCookie } from '../../common/utils/authTokenService';
import redisClient from '../../config/redis';
import { redisKey } from '../../common/utils/redisKey';
import { v4 } from 'uuid';


export const addUser = async (req: Request, res: Response) => {
	try {

		const body = CreateUserSchema.parse(req.body);
		const { user, otp } = await userService.createUserService(body);
		successHandler(res, 'User created successfully', { id: user.dataValues.id, otp }, 201);
	} catch (error) {
		console.log(error);
		const errorParser = parseError(error);
		errorHandler(res, "Failed to create user", errorParser.message, errorParser.statusCode);
	}
}




export const verifyOtp = async (req: Request, res: Response) => {
	try {
		const body = UserOtpVerifySchema.parse(req.body);
		const { token } = await userService.verifyOtpService(body.email, body.otp, req, res);
		successHandler(res, 'Email verified successfully', { token }, 200);
	} catch (error) {
		const errorParser = parseError(error);
		errorHandler(res, "Failed to verify email", errorParser.message, errorParser.statusCode);
	}
}


export const loginUser = async (req: Request, res: Response) => {
	try {
		console.log(req.body);
		const body = UserLoginSchema.parse(req.body);
		const { token } = await userService.loginUserService(body.email, body.password, req, res);
		successHandler(res, 'Login successful', { token }, 200);
	} catch (error) {
		console.log(error);
		const errorParser = parseError(error);
		errorHandler(res, "Failed to login", errorParser.message, errorParser.statusCode);
	}
}


export const getUserProfile = async (req: Request, res: Response) => {
	try {
		if (!req.user) {
			errorHandler(res, 'Unauthorized', {}, 401);
			return;
		}
		const userId = Number(req.user.userId);
		if (Number.isNaN(userId)) {
			errorHandler(res, 'Invalid user id', {}, 400);
			return;
		}
		const user = await userService.getUserProfileService(userId);
		successHandler(res, 'User profile fetched successfully', user, 200);
	} catch (error) {
		const errorParser = parseError(error);
		errorHandler(res, "Failed to fetch user profile", errorParser.message, errorParser.statusCode);
	}
}

export const updateUserProfile = async (req: Request, res: Response) => {
	try {
		if (!req.user) {
			errorHandler(res, 'Unauthorized', {}, 401);
			return;
		}
		const userId = Number(req.user.userId);
		if (Number.isNaN(userId)) {
			errorHandler(res, 'Invalid user id', {}, 400);
			return;
		}
		const body = UpdateUserSchema.parse(req.body);
		await userService.updateUserProfileService(userId, body as any);
		successHandler(res, 'User profile updated successfully', {}, 200);
	} catch (error) {
		const errorParser = parseError(error);
		errorHandler(res, "Failed to update user profile", errorParser.message, errorParser.statusCode);
	}
}

export const blockUser = async (req: Request, res: Response) => {
	try {
		if (!req.user) {
			errorHandler(res, 'Unauthorized', {}, 401);
			return;
		}
		const userId = Number(req.user.userId);
		if (Number.isNaN(userId)) {
			errorHandler(res, 'Invalid user id', {}, 400);
			return;
		}
		await userService.blockUserService(userId);
		successHandler(res, 'User blocked successfully', {}, 200);
	} catch (error) {
		const errorParser = parseError(error);
		errorHandler(res, "Failed to block user", errorParser.message, errorParser.statusCode);
	}
}

export const forgotPasswordOtp = async (req: Request, res: Response) => {
	try {
		const body = ForgotPasswordSchema.parse(req.body);
		const result = await userService.forgotPasswordOtpService(body.email);
		successHandler(res, result.message, {}, 200);
	} catch (error) {
		const errorParser = parseError(error);
		errorHandler(res, "Failed to send password reset OTP", errorParser.message, errorParser.statusCode);
	}
}

export const forgotPasswordLink = async (req: Request, res: Response) => {
	try {
		const body = ForgotPasswordSchema.parse(req.body);
		const result = await userService.forgotPasswordLinkService(body.email);
		successHandler(res, result.message, {}, 200);
	} catch (error) {
		const errorParser = parseError(error);
		errorHandler(res, "Failed to send password reset link", errorParser.message, errorParser.statusCode);
	}
}

export const resetPasswordWithOtp = async (req: Request, res: Response) => {
	try {
		const body = ResetPasswordWithOtpSchema.parse(req.body);
		const result = await userService.resetPasswordWithOtpService(body.email, body.otp, body.newPassword);
		successHandler(res, result.message, {}, 200);
	} catch (error) {
		const errorParser = parseError(error);
		errorHandler(res, "Failed to reset password", errorParser.message, errorParser.statusCode);
	}
}

export const resetPasswordWithToken = async (req: Request, res: Response) => {
	try {
		const body = ResetPasswordWithTokenSchema.parse(req.body);
		const result = await userService.resetPasswordWithTokenService(body.token, body.newPassword);
		successHandler(res, result.message, {}, 200);
	} catch (error) {
		const errorParser = parseError(error);
		errorHandler(res, "Failed to reset password", errorParser.message, errorParser.statusCode);
	}
}



export const refreshTokenController = async (req: Request, res: Response) => {
	try {
		const rawToken = req.cookies?.refresh_token;
		if (!rawToken) {
			errorHandler(res, "Refresh token missing", {}, 401);
			return
		}

		// find session by hashed token
		const session = await findValidRefreshSession(rawToken);
		if (!session) {
			errorHandler(res, "Invalid or expired refresh token", {}, 401);
			return
		}

		// Optionally: verify IP / User-Agent consistency here
		// if (session.ip_address !== calculatedIP) { ... }

		// get user
		const user = await User.findOne({
			where: { id: session.user_id, block: false },
			attributes: ["id", "email"],
		});

		if (!user) {
			errorHandler(res, "User not found", {}, 401);
			return
		}


		await redisClient.del(redisKey("session", user.dataValues.id, req.user.deviceId, req.user.jti));

		// rotate refresh token
		const newRawRefreshToken = await rotateRefreshToken(session, req);
		setRefreshTokenCookie(res, newRawRefreshToken);

		const deviceId = v4();
		const jti = v4();

		// new access token
		const accessToken = generateAccessToken({
			id: user.dataValues.id,
			email: user.dataValues.email,
			deviceId: deviceId,
			jti: jti
		});
		const redisKeyGen = redisKey("session", user.dataValues.id, deviceId, jti);
		await redisClient.set(redisKeyGen, accessToken, { EX: 60 * 60 }); // 1 hour

		successHandler(res, "Token Generated", accessToken, 200)
	} catch (err: any) {
		console.error("Refresh token error:", err);
		errorHandler(res, "Could not refresh token", {}, 500);
		return

	}
};




export const logoutController = async (req: Request, res: Response) => {
	try {
		const rawToken = req.cookies?.refresh_token;
		const userId = req.user.userId;
		console.log("raw token ", rawToken)

		if (rawToken) {
			const session = await findValidRefreshSession(rawToken, userId);
			if (session) {
				await revokeRefreshSession(session);
			}
		}

		clearRefreshTokenCookie(res);
		let redisKey = `user:token:${userId}`;
		await redisClient.del(redisKey);
		successHandler(res, "Logged out successfully", {}, 200)
	} catch (err: any) {
		console.error("Logout error:", err);
		errorHandler(res, "Logout failed", {}, 500);
	}
};