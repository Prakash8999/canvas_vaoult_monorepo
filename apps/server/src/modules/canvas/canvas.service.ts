import { CanvasCreationAttributes, CanvasUpdateAttributes } from "./canvas.model";
import { Op, Transaction } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { Canvas, Note } from "../shared/model/model.relation";
import sequelize from "../../config/database";
import redisClient from "../../config/redis";
import { paginateAndSort } from "../../common/utils/pagination.utils";

// Helper: Deletes all list caches recorded in the user's tracker
const invalidateUserCache = async (userId: number) => {
    const trackerKey = `user:${userId}:canvas_cache_tracker`;
    const keysToDelete = await redisClient.sMembers(trackerKey);

    if (keysToDelete.length > 0) {
        const pipeline = redisClient.multi();
        pipeline.del(keysToDelete); // Delete the actual cached lists
        pipeline.del(trackerKey);   // Delete the tracker itself
        await pipeline.exec();
        console.log(`Invalidated ${keysToDelete.length} canvas cache keys for user ${userId}`);
    }
};

// Filter interface based on Canvas model fields
export interface CanvasFilters {
    id?: number;
    canvas_uid?: string;
    note_id?: number | null;
    title?: string; // Will use ILIKE for partial match
    pinned?: boolean;
    created_at?: Date;
    updated_at?: Date;
    // Pagination & search
    search?: string; // Special: searches across title
    page?: number;
    limit?: number;
}

export const createCanvasService = async (data: CanvasCreationAttributes, userId: number): Promise<Canvas> => {
    const transaction: Transaction = await sequelize.transaction();

    try {
        const canvas_uid = uuidv4();

        // If note_id is provided, verify it exists and belongs to the user
        if (data.note_id) {
            const note = await Note.findOne({
                where: { id: data.note_id, user_id: userId },
                transaction
            });

            if (!note) {
                throw new Error('Associated note not found or does not belong to user');
            }
        }

        const canvasData = {
            ...data,
            user_id: userId,
            canvas_uid,
            created_at: new Date(),
            updated_at: new Date(),
        };

        const canvas = await Canvas.create(canvasData, { transaction });

        await transaction.commit();
        await invalidateUserCache(userId);

        return canvas;
    } catch (error) {
        await transaction.rollback();
        console.error('Error creating canvas:', error);
        throw error;
    }
};

export const getAllCanvasesService = async (
    userId: number,
    filters: CanvasFilters = {}
): Promise<{ data: Canvas[], meta: any }> => {
    try {
        const {
            search,
            page = 1,
            limit = 10,
            ...modelFilters
        } = filters;

        // Calculate offset from page
        const offset = (page - 1) * limit;

        // Generate Redis key similar to notes service
        const redisKeyGen = `canvases:${userId}:${limit}:${offset}:${search || ''}:${JSON.stringify(modelFilters)}`;
        const trackerKey = `user:${userId}:canvas_cache_tracker`;

        const cachedCanvases = await redisClient.get(redisKeyGen);
        if (cachedCanvases) {
            console.log('Canvases found in cache');
            return JSON.parse(cachedCanvases);
        }

        console.log('Canvases not found in cache');

        const whereClause: any = { user_id: userId };

        // Apply model-based filters
        if (modelFilters.id !== undefined) whereClause.id = modelFilters.id;
        if (modelFilters.canvas_uid !== undefined) whereClause.canvas_uid = modelFilters.canvas_uid;
        if (modelFilters.note_id !== undefined) whereClause.note_id = modelFilters.note_id;
        if (modelFilters.pinned !== undefined) whereClause.pinned = modelFilters.pinned;
        if (modelFilters.created_at !== undefined) whereClause.created_at = modelFilters.created_at;
        if (modelFilters.updated_at !== undefined) whereClause.updated_at = modelFilters.updated_at;

        // Handle title filter (exact or partial match)
        if (modelFilters.title !== undefined) {
            whereClause.title = modelFilters.title;
        }

        // Handle search (overrides title filter for partial match)
        if (search) {
            whereClause.title = { [Op.iLike]: `%${search}%` };
        }

        const result = await paginateAndSort<Canvas>(
            Canvas,
            whereClause,
            page,
            limit,
            [['updated_at', 'DESC']],
            [
                {
                    model: Note,
                    as: 'note',
                    attributes: ['id', 'title', 'note_uid', 'created_at', 'updated_at'],
                    required: false
                }
            ]
        );

        // Cache using pipeline like notes service
        const pipeline = redisClient.multi();
        pipeline.set(redisKeyGen, JSON.stringify(result), {
            EX: 60 * 60, // 1 hour
        });
        pipeline.sAdd(trackerKey, redisKeyGen);
        pipeline.expire(trackerKey, 60 * 60);

        await pipeline.exec();

        return result;
    } catch (error) {
        console.error('Error fetching canvases:', error);
        throw error;
    }
};

export const getCanvasByUidService = async (uid: string, userId: number): Promise<Canvas | null> => {
    try {
        const cacheKey = `canvas:${uid}:${userId}`;

        const cachedCanvas = await redisClient.get(cacheKey);
        if (cachedCanvas) {
            console.log('Canvas found in cache');
            return JSON.parse(cachedCanvas);
        }

        console.log('Canvas not found in cache');

        const canvas = await Canvas.findOne({
            where: { canvas_uid: uid, user_id: userId },
            include: [
                {
                    model: Note,
                    as: 'note',
                    attributes: ['id', 'title', 'note_uid', 'content', 'created_at', 'updated_at']
                }
            ],
            raw: false,
            nest: true,
        });

        if (canvas) {
            await redisClient.set(cacheKey, JSON.stringify(canvas), {
                EX: 60 * 30, // Cache for 30 minutes
            });
        }

        console.log('Fetched canvas by uid:', uid, canvas ? 'found' : 'not found');
        return canvas;
    } catch (error) {
        console.error('Error fetching canvas:', error);
        throw error;
    }
};

export const updateCanvasService = async (
    id: number,
    data: CanvasUpdateAttributes,
    userId: number
): Promise<Canvas | null> => {
    const transaction: Transaction = await sequelize.transaction();

    try {
        // 1. Check canvas ownership
        const existingCanvas = await Canvas.findOne({
            where: { id, user_id: userId },
            transaction,
        });

        if (!existingCanvas) {
            throw new Error("Canvas not found");
        }

        // 2. If note_id is being updated, verify the note exists and belongs to user
        if (data.note_id !== undefined && data.note_id !== null) {
            const note = await Note.findOne({
                where: { id: data.note_id, user_id: userId },
                transaction
            });

            if (!note) {
                throw new Error('Associated note not found or does not belong to user');
            }

            // If note exists and has document_data, update it
            if (data.document_data) {
                await Note.update(
                    {
                        content: data.document_data,
                        updated_at: new Date()
                    },
                    {
                        where: { id: data.note_id, user_id: userId },
                        transaction
                    }
                );
            }
        }

        const updateData = {
            ...data,
            updated_at: new Date(),
        };

        // 3. Update canvas inside transaction
        await Canvas.update(updateData, {
            where: { id, user_id: userId },
            transaction,
        });

        await redisClient.del(`canvas:${existingCanvas.dataValues.canvas_uid}:${userId}`);
        await invalidateUserCache(userId);

        // 4. Commit transaction
        await transaction.commit();

        // 5. Fetch and return updated canvas
        return await Canvas.findByPk(id, {
            include: [
                {
                    model: Note,
                    as: 'note',
                    attributes: ['id', 'title', 'note_uid', 'content', 'created_at', 'updated_at']
                }
            ]
        });

    } catch (error) {
        console.error("Error updating canvas:", error);
        await transaction.rollback();
        throw error;
    }
};

export const deleteCanvasService = async (id: number, userId: number): Promise<boolean> => {
    try {
        const canvas = await Canvas.findOne({
            where: { id: id, user_id: userId },
            raw: true,
            attributes: ['canvas_uid']
        });

        if (!canvas) {
            return false;
        }

        const deletedRows = await Canvas.destroy({
            where: { id, user_id: userId }
        });

        if (deletedRows > 0) {
            await redisClient.del(`canvas:${canvas.canvas_uid}:${userId}`);
            await invalidateUserCache(userId);
        }

        return deletedRows > 0;
    } catch (error) {
        console.error('Error deleting canvas:', error);
        throw error;
    }
};
