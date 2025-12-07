import { Request, Response } from "express";
import { errorHandler, successHandler } from "../../common/middlewares/responseHandler";
import { parseError } from "../../common/utils/error.parser";
import * as qcService from "./qc.service";
import { NoteQueryAttributes } from "../notes/notes.model";

// CRUD Operations

export const createQuickCapture = async (req: Request, res: Response) => {
    try {
        if (!req.user || !req.user.userId) {
            errorHandler(res, "Unauthorized", {}, 401);
            return;
        }
        const userId = req.user.userId;
        const note = await qcService.createQuickCaptureService(req.body, userId);
        successHandler(res, "Quick capture created successfully", note, 201);
    } catch (error) {
        console.error("Error creating quick capture:", error);
        const errorParser = parseError(error);
        errorHandler(res, "Failed to create quick capture", errorParser.message, errorParser.statusCode);
    }
};

export const getAllQuickCaptures = async (req: Request, res: Response) => {
    try {
        const userId = req.user.userId;

        // Query params are already validated and typed by validateQuery middleware
        const filters: NoteQueryAttributes = {
            ...req.query,
        };

        const result = await qcService.getAllQuickCapturesService(userId, filters);

        const responseData = {
            quickCaptures: result.data,
            pagination: {
                total: result.meta.total_count,
                page: result.meta.page,
                limit: result.meta.limit,
                totalPages: result.meta.total_pages,
                hasMore: result.meta.page < result.meta.total_pages,
            }
        };

        successHandler(res, "Quick captures fetched successfully", responseData, 200);
        return;
    } catch (error) {
        console.log("Error fetching quick captures:", error);
        const errorParser = parseError(error);
        errorHandler(res, "Failed to fetch quick captures", errorParser.message, errorParser.statusCode);
        return
    }
};

export const getQuickCapture = async (req: Request, res: Response) => {
    try {
        const userId = req.user.userId;
        // Params are validated by validateParams middleware
        const { id } = req.params;

        const note = await qcService.getQuickCaptureByIdService(Number(id), userId);

        if (!note) {
            errorHandler(res, "Quick capture not found", {}, 404);
            return
        }

        successHandler(res, "Quick capture fetched successfully", note, 200);
        return;
    } catch (error) {
        const errorParser = parseError(error);
        errorHandler(res, "Failed to fetch quick capture", errorParser.message, errorParser.statusCode);
        return;
    }
};

export const updateQuickCapture = async (req: Request, res: Response) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        console.log("Updating quick capture body:", req.body);
        const note = await qcService.updateQuickCaptureService(Number(id), req.body, userId);

        if (!note) {
            errorHandler(res, "Quick capture not found", {}, 404);
            return;
        }

        successHandler(res, "Quick capture updated successfully", note, 200);
        return;
    } catch (error) {
        console.error("Error updating quick capture:", error);
        const errorParser = parseError(error);
        errorHandler(res, "Failed to update quick capture", errorParser.message, errorParser.statusCode);
        return;
    }
};

export const deleteQuickCapture = async (req: Request, res: Response) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const deleted = await qcService.deleteQuickCaptureService(Number(id), userId);

        if (!deleted) {
            errorHandler(res, "Quick capture not found", {}, 404);
            return;
        }

        successHandler(res, "Quick capture deleted successfully", { deletedId: Number(id) }, 200);
        return;
    } catch (error) {
        const errorParser = parseError(error);
        errorHandler(res, "Failed to delete quick capture", errorParser.message, errorParser.statusCode);
        return;
    }
};
