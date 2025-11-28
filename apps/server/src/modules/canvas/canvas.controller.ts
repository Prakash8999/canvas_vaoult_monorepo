import { Request, Response } from "express";
import { errorHandler, successHandler } from "../../common/middlewares/responseHandler";
import { parseError } from "../../common/utils/error.parser";
import * as canvasService from "./canvas.service";

// CRUD Operations

export const createCanvas = async (req: Request, res: Response) => {
    try {
        if (!req.user || !req.user.userId) {
            errorHandler(res, "Unauthorized", {}, 401);
            return;
        }
        const userId = req.user.userId;
        const canvas = await canvasService.createCanvasService(req.body, userId);
        successHandler(res, "Canvas created successfully", canvas, 201);
    } catch (error) {
        console.error("Error creating canvas:", error);
        const errorParser = parseError(error);
        errorHandler(res, "Failed to create canvas", errorParser.message, errorParser.statusCode);
    }
};

export const getAllCanvases = async (req: Request, res: Response) => {
    try {
        const userId = req.user.userId;

        // Build filters from query parameters
        const filters: canvasService.CanvasFilters = {
            page: req.query.page ? parseInt(req.query.page as string) : 1,
            limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
            search: req.query.search as string | undefined,
            pinned: req.query.isPinned === 'true' ? true : undefined,
            id: req.query.id ? parseInt(req.query.id as string) : undefined,
            canvas_uid: req.query.canvas_uid as string | undefined,
            note_id: req.query.note_id ? parseInt(req.query.note_id as string) : undefined,
        };

        const result = await canvasService.getAllCanvasesService(userId, filters);

        const responseData = {
            canvases: result.data,
            pagination: {
                total: result.meta.total_count,
                page: result.meta.page,
                limit: result.meta.limit,
                totalPages: result.meta.total_pages,
                hasMore: result.meta.page < result.meta.total_pages,
            }
        };

        return successHandler(res, "Canvases fetched successfully", responseData, 200);
    } catch (error) {
        console.log("Error fetching canvases:", error);
        const errorParser = parseError(error);
        return errorHandler(res, "Failed to fetch canvases", errorParser.message, errorParser.statusCode);
    }
};

export const getCanvas = async (req: Request, res: Response) => {
    try {
        const userId = req.user.userId;
        const uid = req.params.uid;
        console.log('Fetching canvas with uid:', uid, 'for userId:', userId);

        const canvas = await canvasService.getCanvasByUidService(uid, userId);

        if (!canvas) {
            return errorHandler(res, "Canvas not found", {}, 404);
        }

        return successHandler(res, "Canvas fetched successfully", {
            id: canvas.id,
            canvas_uid: canvas.canvas_uid,
            title: canvas.title,
            userId: canvas.user_id,
            note_id: canvas.note_id,
            canvas_data: canvas.canvas_data,
            document_data: canvas.document_data,
            viewport: canvas.viewport,
            pinned: canvas.pinned,
            created_at: canvas.created_at,
            updated_at: canvas.updated_at,
            note: canvas.note || null,
        }, 200);
    } catch (error) {
        const errorParser = parseError(error);
        return errorHandler(res, "Failed to fetch canvas", errorParser.message, errorParser.statusCode);
    }
};

export const updateCanvas = async (req: Request, res: Response) => {
    try {
        const userId = req.user.userId;
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return errorHandler(res, "Invalid canvas ID", {}, 400);
        }

        console.log("Updating canvas body:", req.body);
        const canvas = await canvasService.updateCanvasService(id, req.body, userId);

        if (!canvas) {
            return errorHandler(res, "Canvas not found", {}, 404);
        }

        return successHandler(res, "Canvas updated successfully", {
            id: canvas.id,
            canvas_uid: canvas.canvas_uid,
            title: canvas.title,
            note_id: canvas.note_id,
            canvas_data: canvas.canvas_data,
            document_data: canvas.document_data,
            viewport: canvas.viewport,
            pinned: canvas.pinned,
            created_at: canvas.created_at,
            updated_at: canvas.updated_at,
            note: canvas.note || null,
        }, 200);
    } catch (error) {
        console.error("Error updating canvas:", error);
        const errorParser = parseError(error);
        return errorHandler(res, "Failed to update canvas", errorParser.message, errorParser.statusCode);
    }
};

export const deleteCanvas = async (req: Request, res: Response) => {
    try {
        const userId = req.user.userId;
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return errorHandler(res, "Invalid canvas ID", {}, 400);
        }

        const deleted = await canvasService.deleteCanvasService(id, userId);

        if (!deleted) {
            return errorHandler(res, "Canvas not found", {}, 404);
        }

        return successHandler(res, "Canvas deleted successfully", { deletedId: id }, 200);
    } catch (error) {
        const errorParser = parseError(error);
        return errorHandler(res, "Failed to delete canvas", errorParser.message, errorParser.statusCode);
    }
};
