import { Router } from 'express';
import * as userController from './user.controller';
import { authUser } from '../../common/middlewares/auth/authMiddleware';


const router = Router();

// Public routes
router.post('/signup', userController.addUser);
router.post('/verify-otp', userController.verifyOtp);
router.post('/login', userController.loginUser);
router.post('/forgot-password-otp', userController.forgotPasswordOtp);
router.post('/forgot-password-link', userController.forgotPasswordLink);
router.post('/reset-password-otp', userController.resetPasswordWithOtp);
router.post('/reset-password-token', userController.resetPasswordWithToken);

// Protected routes
router.get('/', authUser, userController.getUserProfile);
router.patch('/', authUser, userController.updateUserProfile);
router.delete('/', authUser, userController.blockUser);
router.post('/logout', authUser, userController.logoutController);
router.post('/refresh-token', userController.refreshTokenController);

export default router;
