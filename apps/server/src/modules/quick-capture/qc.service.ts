import { NoteCreationAttributes, NoteQueryAttributes, NoteUpdateAttributes } from "../notes/notes.model";
import { Op, Transaction } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { Note } from "../shared/model/model.relation";
import sequelize from "../../config/database";
import redisClient from "../../config/redis";
import { paginateAndSort } from "../../common/utils/pagination.utils";

// Helper: Deletes all list caches recorded in the user's tracker
const invalidateUserCache = async (userId: number) => {
    const trackerKey = `user:${userId}:qc_cache_tracker`;
    const keysToDelete = await redisClient.sMembers(trackerKey);

    if (keysToDelete.length > 0) {
        const pipeline = redisClient.multi();
        pipeline.del(keysToDelete); // Delete the actual cached lists
        pipeline.del(trackerKey);   // Delete the tracker itself
        await pipeline.exec();
        console.log(`Invalidated ${keysToDelete.length} qc cache keys for user ${userId}`);
    }
};

export const createQuickCaptureService = async (data: NoteCreationAttributes, userId: number): Promise<Note> => {
    const transaction: Transaction = await sequelize.transaction();

    try {
        const note_uid = uuidv4();

        const noteData = {
            ...data,
            user_id: userId,
            note_type: 'quick_capture' as 'quick_capture',
            version: 1,
            note_uid,
            created_at: new Date(),
            updated_at: new Date(),
        };

        const note = await Note.create(noteData, { transaction });

        await transaction.commit();
        await invalidateUserCache(userId);

        return note;
    } catch (error) {
        await transaction.rollback();
        console.error('Error creating quick capture:', error);
        throw error;
    }
};

export const getAllQuickCapturesService = async (
    userId: number,
    filters: NoteQueryAttributes = {}
): Promise<{ data: Note[], meta: any }> => {
    try {
        const {
            search,
            page = 1,
            limit = 10,
            sort = 'desc',
            sort_by = 'updated_at',
            ...modelFilters
        } = filters;

        // Calculate offset from page
        const offset = (page - 1) * limit;

        // Redis key for caching
        const redisKeyGen = `qc:${userId}:${limit}:${offset}:${search || ''}:${JSON.stringify(modelFilters)}:${sort}:${sort_by}`;
        const trackerKey = `user:${userId}:qc_cache_tracker`;

        const cachedNotes = await redisClient.get(redisKeyGen);
        if (cachedNotes) {
            console.log('Quick captures found in cache');
            return JSON.parse(cachedNotes);
        }

        console.log('Quick captures not found in cache');

        const whereClause: any = { user_id: userId, note_type: 'quick_capture' };

        // Apply model-based filters
        if (modelFilters.id !== undefined) whereClause.id = modelFilters.id;
        if (modelFilters.note_uid !== undefined) whereClause.note_uid = modelFilters.note_uid;
        if (modelFilters.pinned !== undefined) whereClause.pinned = modelFilters.pinned;
        if (modelFilters.created_at !== undefined) whereClause.created_at = modelFilters.created_at;
        if (modelFilters.updated_at !== undefined) whereClause.updated_at = modelFilters.updated_at;

        // Handle title filter
        if (modelFilters.title !== undefined) {
            whereClause.title = modelFilters.title;
        }

        // Handle search
        if (search) {
            whereClause.title = { [Op.iLike]: `%${search}%` };
        }

        const result = await paginateAndSort<Note>(
            Note,
            whereClause,
            page,
            limit,
            [[sort_by, sort.toUpperCase()]],
            undefined,
            ['id', 'note_uid', 'user_id', 'title', 'content', 'tags', 'version', 'pinned', 'created_at', 'updated_at']
        );

        // Cache using pipeline
        const pipeline = redisClient.multi();
        pipeline.set(redisKeyGen, JSON.stringify(result), {
            EX: 60 * 60, // 1 hour
        });
        pipeline.sAdd(trackerKey, redisKeyGen);
        pipeline.expire(trackerKey, 60 * 60);

        await pipeline.exec();

        return result;
    } catch (error) {
        console.error('Error fetching quick captures:', error);
        throw error;
    }
};

export const getQuickCaptureByIdService = async (id: number, userId: number): Promise<Note | null> => {
    try {
        const cacheKey = `qc:id:${id}:${userId}`;

        const cachedNote = await redisClient.get(cacheKey);
        if (cachedNote) {
            console.log('Quick capture found in cache');
            return JSON.parse(cachedNote);
        }

        const note = await Note.findOne({
            where: { id: id, user_id: userId, note_type: 'quick_capture' },
            raw: true,
            nest: true,
        });

        if (note) {
            await redisClient.set(cacheKey, JSON.stringify(note), {
                EX: 60 * 30, // Cache for 30 minutes
            });
        }

        console.log('Fetched quick capture by id:', id, note ? 'found' : 'not found');
        return note;
    } catch (error) {
        console.error('Error fetching quick capture:', error);
        throw error;
    }
};

export const updateQuickCaptureService = async (
    id: number,
    data: NoteUpdateAttributes,
    userId: number
): Promise<Note | null> => {
    const transaction: Transaction = await sequelize.transaction();

    try {
        // 1. Check ownership
        const existingNote = await Note.findOne({
            where: { id, user_id: userId, note_type: 'quick_capture' },
            transaction,
        });

        if (!existingNote) {
            throw new Error("Quick capture not found");
        }

        // 2. Version increment
        const currentVersion: number = existingNote.dataValues.version || 0;
        const note_type = existingNote.dataValues.note_type || 'quick_capture';

        const updateData = {
            ...data,
            note_type: note_type,
            version: currentVersion + 1,
            updated_at: new Date(),
        };

        // 3. Update inside transaction
        await Note.update(updateData, {
            where: { id, user_id: userId },
            transaction,
        });

        await redisClient.del(`qc:id:${id}:${userId}`);
        await invalidateUserCache(userId);

        // 4. Commit transaction
        await transaction.commit();

        // 5. Fetch and return updated note
        return await Note.findByPk(id);

    } catch (error) {
        console.error("Error updating quick capture:", error);
        await transaction.rollback();
        throw error;
    }
};

export const deleteQuickCaptureService = async (id: number, userId: number): Promise<boolean> => {
    try {
        const note = await Note.findOne({
            where: { id: id, user_id: userId, note_type: 'quick_capture' },
            raw: true,
            attributes: ['id']
        });

        if (!note) {
            return false;
        }

        const deletedRows = await Note.destroy({
            where: { id, user_id: userId }
        });

        if (deletedRows > 0) {
            await redisClient.del(`qc:id:${id}:${userId}`);
            await invalidateUserCache(userId);
        }

        return deletedRows > 0;
    } catch (error) {
        console.error('Error deleting quick capture:', error);
        throw error;
    }
};
