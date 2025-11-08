import { NoteCreationAttributes, NoteUpdateAttributes, Note } from "./notes.model";
// import { SyncEventLog } from "./syncEventLog.model";
// import { SyncEvent, Conflict, UpdatedResource } from "./sync.schema";
import { Op } from 'sequelize';



import { v4 as uuidv4 } from 'uuid';
import WikiLink from "./wikilink.model";

// CRUD Operations

export const createNoteService = async (data: NoteCreationAttributes, userId: number): Promise<Note> => {
	try {
		const note_uid = uuidv4();  // guaranteed unique format
		const noteData = {
			...data,
			user_id: userId,
			version: 1,
			note_uid,
			created_at: new Date(),
			updated_at: new Date(),
		};

		if (data.is_wiki_link) {
			if (!data.parent_note_id) {
				throw new Error('Parent note ID is required when creating a wiki link');
			}

			const transaction = await Note.sequelize!.transaction();
			try {
				const note = await Note.create(noteData, { transaction });
				await WikiLink.create({
					user_id: userId,
					parent_note_id: data.parent_note_id,
					child_note_id: note.dataValues.id,
					created_at: new Date(),
					updated_at: new Date(),
				}, { transaction });

				await transaction.commit();
				return note;
			} catch (error) {
				await transaction.rollback();
				throw error;
			}
		} else {
			const note = await Note.create(noteData);
			return note;
		}
	} catch (error) {
		console.error('Error creating note:', error);
		throw error;
	}
};

export const getAllNotesService = async (userId: number, limit?: number, offset?: number, search?: string): Promise<{ notes: Note[], total: number }> => {
	try {
		const whereClause: any = { user_id: userId };
		if (search) {
			whereClause.title = { [Op.iLike]: `%${search}%` };
		}
		console.log('Searching notes with clause:', whereClause);
		const { count, rows } = await Note.findAndCountAll({
			where: whereClause,
			order: [['updated_at', 'DESC']],
			limit: limit || 50,
			offset: offset || 0,
		});
		console.log('Fetched notes:', { userId, count, limit, offset });
		console.log('Notes data:', rows);
		return { notes: rows, total: count };
	} catch (error) {
		console.error('Error fetching notes:', error);
		throw error;
	}
};

export const getNoteByIdService = async (uid: string, userId: number): Promise<Note | null> => {
	try {
		const note = await Note.findOne({
			where: { note_uid: uid, user_id: userId }
		});
		console.log('Fetched note by uid:', uid, note ? 'found' : 'not found');
		return note;
	} catch (error) {
		console.error('Error fetching note:', error);
		throw error;
	}
};

export const updateNoteService = async (id: number, data: NoteUpdateAttributes, userId: number): Promise<Note | null> => {
	try {
		// First check if note exists and belongs to user
		const existingNote = await Note.findOne({
			where: { id, user_id: userId }
		});

		if (!existingNote) {
			throw new Error('Note not found');
		}

		// Update with version increment
		const currentVersion = existingNote.dataValues.version || 0;
		console.log('Current version:', currentVersion);
		const updateData = {
			...data,
			version: currentVersion + 1,
			updated_at: new Date(),
		};

		await Note.update(updateData, {
			where: { id, user_id: userId }
		});

		// Return updated note
		const updatedNote = await Note.findByPk(id);
		return updatedNote;
	} catch (error) {
		console.error('Error updating note:', error);
		throw error;
	}
};

export const deleteNoteService = async (id: number, userId: number): Promise<boolean> => {
	try {
		const deletedRows = await Note.destroy({
			where: { id, user_id: userId }
		});

		return deletedRows > 0;
	} catch (error) {
		console.error('Error deleting note:', error);
		throw error;
	}
};

// Sync Operations

// export const processSyncEvents = async (
// 	events: SyncEvent[], 
// 	clientId: string,
// 	userId: number
// ): Promise<{ applied: string[], updatedResources: UpdatedResource[], conflicts: Conflict[] }> => {

// 	const applied: string[] = [];
// 	const updatedResources: UpdatedResource[] = [];
// 	const conflicts: Conflict[] = [];

// 	// Use transaction for all sync operations
// 	const transaction = await sequelize.transaction();

// 	try {
// 		for (const event of events) {
// 			// Check if event was already processed (idempotency)
// 			const existingEvent = await SyncEventLog.findOne({
// 				where: { event_id: event.id },
// 				transaction
// 			});

// 			if (existingEvent) {
// 				console.log(`Event ${event.id} already processed, skipping`);
// 				continue;
// 			}

// 			let processedSuccessfully = false;
// 			let updatedNote: Note | null = null;

// 			try {
// 				switch (event.type) {
// 					case 'note.create':
// 						updatedNote = await handleCreateEvent(event, userId, transaction);
// 						processedSuccessfully = true;
// 						break;

// 					case 'note.update':
// 						const updateResult = await handleUpdateEvent(event, userId, transaction);
// 						if (updateResult.conflict) {
// 							conflicts.push(updateResult.conflict);
// 						} else if (updateResult.note) {
// 							updatedNote = updateResult.note;
// 							processedSuccessfully = true;
// 						}
// 						break;

// 					case 'note.delete':
// 						await handleDeleteEvent(event, userId, transaction);
// 						processedSuccessfully = true;
// 						break;

// 					default:
// 						console.error(`Unknown event type: ${event.type}`);
// 						continue;
// 				}

// 				if (processedSuccessfully) {
// 					// Log the event as processed
// 					await SyncEventLog.create({
// 						event_id: event.id,
// 						client_id: clientId,
// 						event_type: event.type,
// 						resource_id: event.resourceId,
// 					}, { transaction });

// 					applied.push(event.id);

// 					// Add to updated resources if we have a note
// 					if (updatedNote && event.type !== 'note.delete') {
// 						updatedResources.push({
// 							id: updatedNote.id,
// 							title: updatedNote.title,
// 							content: updatedNote.content,
// 							tags: updatedNote.tags || [],
// 							version: updatedNote.version,
// 							updated_at: updatedNote.updated_at.toISOString(),
// 							pinned: updatedNote.pinned,
// 						});
// 					}
// 				}

// 			} catch (eventError) {
// 				console.error(`Error processing event ${event.id}:`, eventError);
// 				// Continue with next event rather than failing entire batch
// 			}
// 		}

// 		await transaction.commit();
// 		return { applied, updatedResources, conflicts };

// 	} catch (error) {
// 		await transaction.rollback();
// 		console.error('Error in sync transaction:', error);
// 		throw error;
// 	}
// };

// const handleCreateEvent = async (event: SyncEvent, userId: number, transaction: Transaction): Promise<Note> => {
// 	if (!event.payload) {
// 		throw new Error('Create event missing payload');
// 	}

// 	const noteData: NoteCreationAttributes = {
// 		title: event.payload.title || 'Untitled',
// 		content: event.payload.content || { blocks: [] },
// 		tags: event.payload.tags || [],
// 		version: event.payload.version || 1,
// 		pinned: event.payload.pinned || false,
// 	};

// 	// Check if note with this resourceId already exists
// 	const existingNote = await Note.findOne({
// 		where: { 
// 			id: parseInt(event.resourceId),
// 			user_id: userId 
// 		},
// 		transaction
// 	});

// 	if (existingNote) {
// 		throw new Error(`Note with ID ${event.resourceId} already exists`);
// 	}

// 	// Create note data with user_id and timestamps
// 	const createData = {
// 		...noteData,
// 		user_id: userId,
// 		created_at: new Date(event.createdAt),
// 		updated_at: new Date(),
// 	};

// 	const note = await Note.create(createData, { transaction });

// 	return note;
// };

// const handleUpdateEvent = async (
// 	event: SyncEvent, 
// 	userId: number, 
// 	transaction: Transaction
// ): Promise<{ note?: Note, conflict?: Conflict }> => {
// 	if (!event.payload) {
// 		throw new Error('Update event missing payload');
// 	}

// 	const noteId = parseInt(event.resourceId);
// 	const existingNote = await Note.findOne({
// 		where: { id: noteId, user_id: userId },
// 		transaction
// 	});

// 	if (!existingNote) {
// 		throw new Error(`Note ${event.resourceId} not found`);
// 	}

// 	// Check for version conflict
// 	const clientVersion = event.payload.version;
// 	if (clientVersion && clientVersion < existingNote.version) {
// 		return {
// 			conflict: {
// 				resourceId: event.resourceId,
// 				reason: 'version_conflict',
// 				clientVersion: clientVersion,
// 				serverVersion: existingNote.version,
// 				serverState: {
// 					id: existingNote.id,
// 					title: existingNote.title,
// 					content: existingNote.content,
// 					tags: existingNote.tags,
// 					version: existingNote.version,
// 					updated_at: existingNote.updated_at.toISOString(),
// 					pinned: existingNote.pinned,
// 				}
// 			}
// 		};
// 	}

// 	// Apply update
// 	const updateData: Partial<NoteUpdateAttributes> = {};

// 	if (event.payload.title !== undefined) updateData.title = event.payload.title;
// 	if (event.payload.content !== undefined) updateData.content = event.payload.content;
// 	if (event.payload.tags !== undefined) updateData.tags = event.payload.tags;
// 	if (event.payload.pinned !== undefined) updateData.pinned = event.payload.pinned;

// 	// Always increment version and update timestamp
// 	updateData.version = existingNote.version + 1;
// 	updateData.updated_at = new Date();

// 	await Note.update(updateData, {
// 		where: { id: noteId },
// 		transaction
// 	});

// 	const updatedNote = await Note.findByPk(noteId, { transaction });
// 	return { note: updatedNote! };
// };

// const handleDeleteEvent = async (event: SyncEvent, userId: number, transaction: Transaction): Promise<void> => {
// 	const noteId = parseInt(event.resourceId);

// 	const deletedRows = await Note.destroy({
// 		where: { id: noteId, user_id: userId },
// 		transaction
// 	});

// 	if (deletedRows === 0) {
// 		throw new Error(`Note ${event.resourceId} not found or already deleted`);
// 	}
// };

// Legacy methods for backward compatibility
export const addNoteCreateEvent = async (data: NoteCreationAttributes, userId: number) => {
	const note = await createNoteService(data, userId);
	return { success: true, note };
};

export const addNoteUpdateEvent = async (id: number, data: NoteUpdateAttributes) => {
	try {
		const [affectedRows] = await Note.update(data, {
			where: { id }
		});

		if (affectedRows === 0) {
			throw new Error('Note not found or no changes made');
		}

		const updatedNote = await Note.findByPk(id);
		return { success: true, note: updatedNote };
	} catch (error) {
		console.error('Error updating note:', error);
		throw error;
	}
};

export const addNoteDeleteEvent = async (id: number) => {
	try {
		const deletedRows = await Note.destroy({
			where: { id }
		});

		if (deletedRows === 0) {
			throw new Error('Note not found');
		}

		return { success: true, deletedId: id };
	} catch (error) {
		console.error('Error deleting note:', error);
		throw error;
	}
};

export const getNoteById = async (id: number) => {
	try {
		const note = await Note.findByPk(id);
		return note;
	} catch (error) {
		console.error('Error fetching note:', error);
		throw error;
	}
};

export const getAllNotes = async (userId?: number) => {
	try {
		const whereClause = userId ? { user_id: userId } : {};
		const notes = await Note.findAll({
			where: whereClause,
			order: [['updated_at', 'DESC']]
		});
		return notes;
	} catch (error) {
		console.error('Error fetching notes:', error);
		throw error;
	}
};

export const getNotesByIds = async (ids: number[]) => {
	try {
		const notes = await Note.findAll({
			where: {
				id: {
					[Op.in]: ids
				}
			}
		});
		return notes;
	} catch (error) {
		console.error('Error fetching notes by IDs:', error);
		throw error;
	}
};