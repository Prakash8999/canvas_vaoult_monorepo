import { Request, Response } from "express";
import { errorHandler, successHandler } from "../../common/middlewares/responseHandler";
import { parseError } from "../../common/utils/error.parser";
import * as noteService from "./notes.service";

// CRUD Operations

export const createNote = async (req: Request, res: Response) => {
	try {
		if (!req.user || !req.user.userId) {
			errorHandler(res, "Unauthorized", {}, 401);
			return
		}
		const userId = req.user.userId;
		const note = await noteService.createNoteService(req.body, userId);
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
		const search = req.query.search ? (req.query.search as string) : undefined;

		const { notes, total } = await noteService.getAllNotesService(userId, limit, offset, search);
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
				pageNum: Math.floor(offset / limit) + 1,
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
		const uid = req.params.uid
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
		const note = await noteService.updateNoteService(id, req.body, userId);
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



