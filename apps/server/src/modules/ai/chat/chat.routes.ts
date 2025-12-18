import { Router } from 'express';
import { ChatController } from './chat.controller';
import { authUser } from '../../../common/middlewares/auth/authMiddleware';

const router = Router();

// Apply auth middleware to all chat routes
router.use(authUser);

// Chat CRUD
router.post('/', ChatController.createChat);
router.get('/', ChatController.getChats);
router.get('/:id/messages', ChatController.getMessages);
router.patch('/:id', ChatController.updateChat);
router.delete('/:id', ChatController.deleteChat);

// Message / AI Interaction
router.post('/message', ChatController.sendMessage);

export default router;
