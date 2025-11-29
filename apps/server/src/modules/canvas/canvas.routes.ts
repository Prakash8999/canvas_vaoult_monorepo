import { Router } from 'express';
import * as canvasController from './canvas.controller';
import { authUser } from '../../common/middlewares/auth/authMiddleware';
import {
    CreateCanvasSchema,
    UpdateCanvasSchema,
    GetCanvasQuerySchema,
    GetCanvasByUidParamsSchema,
    CanvasIdParamsSchema
} from './canvas.model';
import { validateBody, validateQuery, validateParams } from '../../common/middlewares/validator';

const router = Router();

// All routes require authentication
router.use(authUser);

// CRUD routes
router.post('/', validateBody(CreateCanvasSchema), canvasController.createCanvas);
router.get('/', validateQuery(GetCanvasQuerySchema), canvasController.getAllCanvases);
router.get('/:uid', validateParams(GetCanvasByUidParamsSchema), canvasController.getCanvas);
router.patch('/:id', validateParams(CanvasIdParamsSchema), validateBody(UpdateCanvasSchema), canvasController.updateCanvas);
router.delete('/:id', validateParams(CanvasIdParamsSchema), canvasController.deleteCanvas);

export default router;
