import { Router } from 'express';
import * as canvasController from './canvas.controller';
import { authUser } from '../../common/middlewares/auth/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authUser);

// CRUD routes
router.post('/', canvasController.createCanvas);
router.get('/', canvasController.getAllCanvases);
router.get('/:uid', canvasController.getCanvas);
router.put('/:id', canvasController.updateCanvas);
router.delete('/:id', canvasController.deleteCanvas);

export default router;
