import { Router } from 'express';
import * as qcController from './qc.controller';
import { authUser } from '../../common/middlewares/auth/authMiddleware';
import {
    CreateNoteSchema,
    UpdateNoteSchema,
    GetNotesQuerySchema,
    NoteIdParamsSchema
} from '../notes/notes.model';
import { validateBody, validateQuery, validateParams } from '../../common/middlewares/validator';

const router = Router();

// All routes require authentication
router.use(authUser);

// CRUD routes
router.post('/', validateBody(CreateNoteSchema), qcController.createQuickCapture);
router.get('/', validateQuery(GetNotesQuerySchema), qcController.getAllQuickCaptures);
router.get('/:id', validateParams(NoteIdParamsSchema), qcController.getQuickCapture);
router.patch('/:id', validateParams(NoteIdParamsSchema), validateBody(UpdateNoteSchema), qcController.updateQuickCapture);
router.delete('/:id', validateParams(NoteIdParamsSchema), qcController.deleteQuickCapture);

export default router;
