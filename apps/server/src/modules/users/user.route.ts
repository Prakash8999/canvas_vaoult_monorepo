import { Router } from 'express';
import * as userController from './user.controller';
import { authUser } from '../../common/middlewares/auth';


const router = Router();

// Public routes
router.post('/signup', userController.addUser);
router.post('/verify-otp', userController.verifyOtp);
router.post('/login', userController.loginUser);

// Protected routes
router.get('/', authUser, userController.getUserProfile);
router.patch('/', authUser, userController.updateUserProfile);
router.delete('/', authUser, userController.blockUser);

export default router;
