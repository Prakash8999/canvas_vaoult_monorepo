import { AllTagEntry, ExtractedNote, NoteCreationAttributes, NoteUpdateAttributes, TagNoteRef } from "./notes.model";
// import { SyncEventLog } from "./syncEventLog.model";
// import { SyncEvent, Conflict, UpdatedResource } from "./sync.schema";
import { Op, Transaction } from 'sequelize';



import { v4 as uuidv4 } from 'uuid';
import { WikiLink, Note } from "../shared/model/model.relation";
import sequelize from "../../config/database";

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

			const transaction = await sequelize.transaction();
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

export const extractTagsFromContent = (content: any): string[] => {
	if (!content?.blocks) return [];

	// const tags = new Set<string>();
	const tags: string[] = [];
	const tagRegex = /#([a-zA-Z0-9_]+)/g;

	for (const block of content.blocks) {
		let text = "";

		// paragraph, quote, header, etc.
		if (block.data?.text) {
			text = block.data.text;
		}

		// list items stored in block.data.items[].content
		if (block.type === "list" && Array.isArray(block.data?.items)) {
			block.data.items.forEach((item: any) => {
				if (typeof item.content === "string") {
					text += " " + item.content;
				}
			});
		}

		// extract tags inside text
		let match;
		while ((match = tagRegex.exec(text)) !== null) {
			tags.push(match[1].toLowerCase());
		}
	}

	return Array.from(tags);
};



/**
 * Build global allTags list from notes array.
 * Each note already contains tags: string[]
 */
export function buildAllTags(notes: ExtractedNote[]): AllTagEntry[] {
	const tagMap: Record<string, TagNoteRef[]> = {};

	for (const note of notes) {
		const uniqueTags = new Set(note.tags);

		for (const tag of uniqueTags) {
			if (!tagMap[tag]) tagMap[tag] = [];

			// Prevent adding same note twice
			if (!tagMap[tag].some(n => n.note_id === note.id)) {
				tagMap[tag].push({
					note_name: note.title,
					note_uid: note.note_uid,
					note_id: note.id,
					created_at: note.created_at,
					updated_at: note.updated_at,
				});
			}
		}
	}

	return Object.entries(tagMap).map(([tag, notes]) => ({
		tag,
		notes
	}));
}

export const getAllNotesService = async (userId: number, limit?: number, offset?: number, search?: string, isWikilink: boolean = false): Promise<{ notes: Note[], total: number }> => {
	try {
		const whereClause: any = { user_id: userId };
		if (search) {

			whereClause.title = isWikilink
				? search                     // exact match
				: { [Op.iLike]: `%${search}%` };
		}
		console.log('Searching notes with clause:', whereClause);
		const { count, rows } = await Note.findAndCountAll({
			where: whereClause,
			order: [['updated_at', 'DESC']],
			limit: limit || 50,
			offset: offset || 0,
			attributes: isWikilink ? { exclude: ['content'] } : undefined
		});

		return { notes: rows, total: count };
	} catch (error) {
		console.error('Error fetching notes:', error);
		throw error;
	}
};

export const getNoteByIdService = async (uid: string, userId: number): Promise<Note | null> => {
	try {
		const note = await Note.findOne({
			where: { note_uid: uid, user_id: userId },
			include: [
				{
					model: WikiLink,
					as: 'parent_wikilinks',
					include: [{
						model: Note,
						as: 'parent_note',
						attributes: ['id', 'title', 'note_uid']
					}]
				},
				{
					model: WikiLink,
					as: 'child_wikilinks',
					include: [{
						model: Note,
						as: 'child_note',
						attributes: ['id', 'title', 'note_uid']
					}]
				}
			],
		});


		console.log('Fetched note by uid:', uid, note ? 'found' : 'not found');
		return note;
	} catch (error) {
		console.error('Error fetching note:', error);
		throw error;
	}
};

export const updateNoteService = async (
	id: number,
	data: NoteUpdateAttributes,
	userId: number
): Promise<Note | null> => {
	const transaction: Transaction = await sequelize.transaction();

	try {
		// 1. Check note ownership
		const existingNote = await Note.findOne({
			where: { id, user_id: userId },
			transaction,
		});

		if (!existingNote) {
			throw new Error("Note not found");
		}

		// 2. Version increment
		const currentVersion: number = existingNote.dataValues.version || 0;

		const updateData = {
			...data,
			version: currentVersion + 1,
			updated_at: new Date(),
		};

		// 3. Validate wiki link
		if (data.is_wiki_link && !data.child_note_id) {
			throw new Error("Child note ID is required when updating a wiki link");
		}

		// 4. Update note inside transaction
		await Note.update(updateData, {
			where: { id, user_id: userId },
			transaction,
		});

		// 5. Create WikiLink if applicable
		if (data.is_wiki_link && data.child_note_id) {
			await WikiLink.create(
				{
					user_id: userId,
					parent_note_id: id,
					child_note_id: data.child_note_id,
					created_at: new Date(),
					updated_at: new Date(),
				},
				{ transaction }
			);
		}

		// 6. Commit transaction
		await transaction.commit();

		// 7. Fetch and return updated note
		return await Note.findByPk(id);

	} catch (error) {
		console.error("Error updating note:", error);

		// Rollback transaction on error
		await transaction.rollback();

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