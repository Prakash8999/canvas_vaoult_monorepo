import { Request, Response } from 'express';
import { CreateUserSchema, UserLoginSchema, UserOtpVerifySchema, UpdateUserSchema } from './users.model';
import { successHandler, errorHandler } from '../../common/middlewares/responseHandler';
import { parseError } from '../../common/utils/error.parser';
import * as userService from './user.service';


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
		const { token } = await userService.verifyOtpService(body.email, body.otp);
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
		const { token } = await userService.loginUserService(body.email, body.password);
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
