import { Router } from 'express';
import {
	// New CRUD operations
	createNote,
	getAllNotes,
	getNote,
	updateNote,
	deleteNote,

} from './notes.controller';
import { authUser } from '../../common/middlewares/auth';

const router = Router();

// Apply authentication to all routes
router.use(authUser);

// Sync endpoint - main offline-first sync handler
// router.post('/sync/events', handleSyncEvents);

// CRUD operations
router.post('/', createNote);              // POST /api/note - create note
router.get('/notes', getAllNotes);             // GET /api/note - list all notes with pagination
router.get('/:uid', getNote);             // GET /api/note/:uid - get specific note
router.patch('/:id', updateNote);        // PATCH /api/note/:id - update note
router.delete('/:id', deleteNote);       // DELETE /api/note/:id - delete note

export default router;
