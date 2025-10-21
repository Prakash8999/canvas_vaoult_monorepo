import { Request, Response } from "express";
import { errorHandler, successHandler } from "../../common/middlewares/responseHandler";
import { parseError } from "../../common/utils/error.parser";
import * as noteService from "./notes.service";
import { CreateNoteSchema, UpdateNoteSchema } from "./notes.model";

// CRUD Operations

export const createNote = async (req: Request, res: Response) => {
	try {
		const userId = req.user.userId;

		// Validate the request body
		const validatedData = CreateNoteSchema.parse(req.body);
console.log('Validated data for note creation:', validatedData);	
		const note = await noteService.createNoteService(validatedData, userId);
		successHandler(res, "Note created successfully", note, 201);
	} catch (error) {
		console.error("Error creating note:", error);
		const errorParser = parseError(error);
		errorHandler(res, "Failed to create note", errorParser.message, errorParser.statusCode);
	}
};
export const getAllNotes = async (req: Request, res: Response) => {
    try {
        const userId = req.user.userId;

        // Parse pagination parameters
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
        const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;


        const { notes, total } = await noteService.getAllNotesService(userId, limit, offset);
		// console.log('Notes retrieved:', notes);

        const responseData = {
            notes: notes.map(note => {
            
                    // Return full data for detailed view
                    return {
                        id: note.dataValues.id,
                        title: note.dataValues.title,
                        content: note.dataValues.content,
                        tags: note.dataValues.tags,
						note_uid: note.dataValues.note_uid,
                        version: note.dataValues.version,
                        pinned: note.dataValues.pinned,
                        created_at: note.dataValues.created_at,
                        updated_at: note.dataValues.updated_at,
                    };
                
            }),
            pagination: {
                total,
                limit,
                remaining: total - (offset + limit),
				currentNoteCount: notes.length,
                offset,
                hasMore: offset + limit < total,
            }
        };

        return successHandler(res, "Notes fetched successfully", responseData, 200);
    } catch (error) {
        const errorParser = parseError(error);
        return errorHandler(res, "Failed to fetch notes", errorParser.message, errorParser.statusCode);
    }
};



export const getNote = async (req: Request, res: Response) => {
	try {
		const userId = req.user.userId;
		const uid =req.params.uid
console.log('Fetching note with uid:', uid, 'for userId:', userId);
console.log("req.params ", req.params)
	
		const note = await noteService.getNoteByIdService(uid, userId);

		if (!note) {
			return errorHandler(res, "Note not found", {}, 404);
		}

		return successHandler(res, "Note fetched successfully", {
			id: note.dataValues.id,
			title: note.dataValues.title,
			content: note.dataValues.content,
			tags: note.dataValues.tags,
			version: note.dataValues.version,
			note_uid: note.dataValues.note_uid,
			pinned: note.dataValues.pinned,
			created_at: note.dataValues.created_at,
			updated_at: note.dataValues.updated_at,
		}, 200);
	} catch (error) {
		const errorParser = parseError(error);
		return errorHandler(res, "Failed to fetch note", errorParser.message, errorParser.statusCode);
	}
};

export const updateNote = async (req: Request, res: Response) => {
	try {
		const userId = req.user.userId;
		const id = parseInt(req.params.id);

		if (isNaN(id)) {
			return errorHandler(res, "Invalid note ID", {}, 400);
		}

		// Validate the request body
		console.log('Request body for update:', req.body);
		const validatedData = UpdateNoteSchema.parse(req.body);

		const note = await noteService.updateNoteService(id, validatedData, userId);

		if (!note) {
			return errorHandler(res, "Note not found", {}, 404);
		}

		return successHandler(res, "Note updated successfully", {
			id: note.id,
			title: note.title,
			content: note.content,
			tags: note.tags,
			version: note.version,
			pinned: note.pinned,
			created_at: note.created_at,
			updated_at: note.updated_at,
		}, 200);
	} catch (error) {
		console.error("Error updating note:", error);
		const errorParser = parseError(error);
		return errorHandler(res, "Failed to update note", errorParser.message, errorParser.statusCode);
	}
};

export const deleteNote = async (req: Request, res: Response) => {
	try {
		const userId = req.user.userId;
		const id = parseInt(req.params.id);

		if (isNaN(id)) {
			return errorHandler(res, "Invalid note ID", {}, 400);
		}

		const deleted = await noteService.deleteNoteService(id, userId);

		if (!deleted) {
			return errorHandler(res, "Note not found", {}, 404);
		}

		return successHandler(res, "Note deleted successfully", { deletedId: id }, 200);
	} catch (error) {
		const errorParser = parseError(error);
		return errorHandler(res, "Failed to delete note", errorParser.message, errorParser.statusCode);
	}
};

// Sync Operations

// export const handleSyncEvents = async (req: Request, res: Response) => {
// 	try {
// 		const userId = req.user.userId;

// 		// Validate sync request
// 		const validatedRequest = SyncRequestSchema.parse(req.body);

// 		const { applied, updatedResources, conflicts } = await noteService.processSyncEvents(
// 			validatedRequest.events,
// 			validatedRequest.clientId,
// 			userId
// 		);

// 		const responseData = {
// 			applied,
// 			updatedResources,
// 			conflicts,
// 		};

// 		return successHandler(res, "Notes synced successfully", responseData, 200);
// 	} catch (error) {
// 		if (error instanceof z.ZodError) {
// 			return errorHandler(res, "Invalid sync request format", error.issues, 400);
// 		}

// 		const errorParser = parseError(error);
// 		return errorHandler(res, "Failed to sync notes", errorParser.message, errorParser.statusCode);
// 	}
// };

// Legacy event-based handlers (for backward compatibility)

export const noteEvents = async (req: Request, res: Response) => {
	try {
		const { eventType, payload } = req.body;

		if (!eventType || !payload) {
			return errorHandler(res, "Event type and payload are required", {}, 400);
		}

		switch (eventType) {
			case 'note.create':
				return await handleNoteCreate(req, res);
			case 'note.update':
				return await handleNoteUpdate(req, res);
			case 'note.delete':
				return await handleNoteDelete(req, res);
			default:
				return errorHandler(res, "Invalid event type", {}, 400);
		}
	} catch (error) {
		const errorParser = parseError(error);
		return errorHandler(res, "Failed to process note event", errorParser.message, errorParser.statusCode);
	}
};

const handleNoteCreate = async (req: Request, res: Response) => {
	try {
		const { payload } = req.body;
		const userId = req.user.userId;

		// Validate the payload
		const validatedData = CreateNoteSchema.parse(payload);

		const result = await noteService.addNoteCreateEvent(validatedData, userId);

		return successHandler(res, "Note created successfully", {
			...result.note.dataValues
		}, 201);
	} catch (error) {
		const errorParser = parseError(error);
		return errorHandler(res, "Failed to create note", errorParser.message, errorParser.statusCode);
	}
};

const handleNoteUpdate = async (req: Request, res: Response) => {
	try {
		const { payload } = req.body;
		
		console.log('Update payload:', payload);

		if (!payload.id) {
			return errorHandler(res, "Note ID is required for update", {}, 400);
		}

		// Validate the payload (excluding id for update)
		const { id, ...updateData } = payload;
		const validatedData = UpdateNoteSchema.parse(updateData);

		const result = await noteService.addNoteUpdateEvent(id, validatedData);

		if (!result.note) {
			return errorHandler(res, "Note not found after update", {}, 404);
		}

		successHandler(res, "Note updated successfully", {
			...result.note.dataValues
		}, 200);
		return
	} catch (error) {
		console.error("Error updating note:", error);
		const errorParser = parseError(error);

		 errorHandler(res, "Failed to update note", errorParser.message, errorParser.statusCode);
		return
		}
};

const handleNoteDelete = async (req: Request, res: Response) => {
	try {
		const { payload } = req.body;

		if (!payload.id) {
			return errorHandler(res, "Note ID is required for deletion", {}, 400);
		}

		const result = await noteService.addNoteDeleteEvent(payload.id);

		successHandler(res, "Note deleted successfully", { deletedId: result.deletedId }, 200);
		return
	} catch (error) {
		const errorParser = parseError(error);
		errorHandler(res, "Failed to delete note", errorParser.message, errorParser.statusCode);
		return
	}
};

