import { Router } from 'express';
import {
	// New CRUD operations
	createNote,
	getAllNotes,
	getNote,
	updateNote,
	deleteNote,
	getAllTags,

} from './notes.controller';
import { authUser } from '../../common/middlewares/auth';
import { validateBody } from '../../common/middlewares/validator';
import { CreateNoteSchema, UpdateNoteSchema } from './notes.model';

const router = Router();

// Apply authentication to all routes
router.use(authUser);

// Sync endpoint - main offline-first sync handler
// router.post('/sync/events', handleSyncEvents);

// CRUD operations
router.post('/', validateBody(CreateNoteSchema), createNote);   // POST /api/note - create note
router.get('/notes', getAllNotes);             // GET /api/note - list all notes with pagination
router.get('/tags', getAllTags);         // GET /api/note/tags - get all tags
router.get('/:uid', getNote);             // GET /api/note/:uid - get specific note
router.patch('/:id', validateBody(UpdateNoteSchema), updateNote);        // PATCH /api/note/:id - update note
router.delete('/:id', deleteNote);       // DELETE /api/note/:id - delete note
export default router;
