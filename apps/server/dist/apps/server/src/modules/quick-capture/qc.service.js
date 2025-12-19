"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var qc_service_exports = {};
__export(qc_service_exports, {
  createQuickCaptureService: () => createQuickCaptureService,
  deleteQuickCaptureService: () => deleteQuickCaptureService,
  getAllQuickCapturesService: () => getAllQuickCapturesService,
  getQuickCaptureByIdService: () => getQuickCaptureByIdService,
  updateQuickCaptureService: () => updateQuickCaptureService
});
module.exports = __toCommonJS(qc_service_exports);
var import_sequelize = require("sequelize");
var import_uuid = require("uuid");
var import_model = require("../shared/model/model.relation");
var import_database = __toESM(require("../../config/database"));
var import_redis = __toESM(require("../../config/redis"));
var import_pagination = require("../../common/utils/pagination.utils");
const invalidateUserCache = async (userId) => {
  const trackerKey = `user:${userId}:qc_cache_tracker`;
  const keysToDelete = await import_redis.default.sMembers(trackerKey);
  if (keysToDelete.length > 0) {
    const pipeline = import_redis.default.multi();
    pipeline.del(keysToDelete);
    pipeline.del(trackerKey);
    await pipeline.exec();
    console.log(`Invalidated ${keysToDelete.length} qc cache keys for user ${userId}`);
  }
};
const createQuickCaptureService = async (data, userId) => {
  const transaction = await import_database.default.transaction();
  try {
    const note_uid = (0, import_uuid.v4)();
    const noteData = {
      ...data,
      user_id: userId,
      note_type: "quick_capture",
      version: 1,
      note_uid,
      created_at: /* @__PURE__ */ new Date(),
      updated_at: /* @__PURE__ */ new Date()
    };
    const note = await import_model.Note.create(noteData, { transaction });
    await transaction.commit();
    await invalidateUserCache(userId);
    return note;
  } catch (error) {
    await transaction.rollback();
    console.error("Error creating quick capture:", error);
    throw error;
  }
};
const getAllQuickCapturesService = async (userId, filters = {}) => {
  try {
    const {
      search,
      page = 1,
      limit = 10,
      sort = "desc",
      sort_by = "updated_at",
      ...modelFilters
    } = filters;
    const offset = (page - 1) * limit;
    const redisKeyGen = `qc:${userId}:${limit}:${offset}:${search || ""}:${JSON.stringify(modelFilters)}:${sort}:${sort_by}`;
    const trackerKey = `user:${userId}:qc_cache_tracker`;
    const cachedNotes = await import_redis.default.get(redisKeyGen);
    if (cachedNotes) {
      console.log("Quick captures found in cache");
      return JSON.parse(cachedNotes);
    }
    console.log("Quick captures not found in cache");
    const whereClause = { user_id: userId, note_type: "quick_capture" };
    if (modelFilters.id !== void 0)
      whereClause.id = modelFilters.id;
    if (modelFilters.note_uid !== void 0)
      whereClause.note_uid = modelFilters.note_uid;
    if (modelFilters.pinned !== void 0)
      whereClause.pinned = modelFilters.pinned;
    if (modelFilters.created_at !== void 0)
      whereClause.created_at = modelFilters.created_at;
    if (modelFilters.updated_at !== void 0)
      whereClause.updated_at = modelFilters.updated_at;
    if (modelFilters.title !== void 0) {
      whereClause.title = modelFilters.title;
    }
    if (search) {
      whereClause.title = { [import_sequelize.Op.iLike]: `%${search}%` };
    }
    const result = await (0, import_pagination.paginateAndSort)(
      import_model.Note,
      whereClause,
      page,
      limit,
      [[sort_by, sort.toUpperCase()]],
      void 0,
      ["id", "note_uid", "user_id", "title", "content", "tags", "version", "pinned", "created_at", "updated_at"]
    );
    const pipeline = import_redis.default.multi();
    pipeline.set(redisKeyGen, JSON.stringify(result), {
      EX: 60 * 60
      // 1 hour
    });
    pipeline.sAdd(trackerKey, redisKeyGen);
    pipeline.expire(trackerKey, 60 * 60);
    await pipeline.exec();
    return result;
  } catch (error) {
    console.error("Error fetching quick captures:", error);
    throw error;
  }
};
const getQuickCaptureByIdService = async (id, userId) => {
  try {
    const cacheKey = `qc:id:${id}:${userId}`;
    const cachedNote = await import_redis.default.get(cacheKey);
    if (cachedNote) {
      console.log("Quick capture found in cache");
      return JSON.parse(cachedNote);
    }
    const note = await import_model.Note.findOne({
      where: { id, user_id: userId, note_type: "quick_capture" },
      raw: true,
      nest: true
    });
    if (note) {
      await import_redis.default.set(cacheKey, JSON.stringify(note), {
        EX: 60 * 30
        // Cache for 30 minutes
      });
    }
    console.log("Fetched quick capture by id:", id, note ? "found" : "not found");
    return note;
  } catch (error) {
    console.error("Error fetching quick capture:", error);
    throw error;
  }
};
const updateQuickCaptureService = async (id, data, userId) => {
  const transaction = await import_database.default.transaction();
  try {
    const existingNote = await import_model.Note.findOne({
      where: { id, user_id: userId, note_type: "quick_capture" },
      transaction
    });
    if (!existingNote) {
      throw new Error("Quick capture not found");
    }
    const currentVersion = existingNote.dataValues.version || 0;
    const note_type = existingNote.dataValues.note_type || "quick_capture";
    const updateData = {
      ...data,
      note_type,
      version: currentVersion + 1,
      updated_at: /* @__PURE__ */ new Date()
    };
    await import_model.Note.update(updateData, {
      where: { id, user_id: userId },
      transaction
    });
    await import_redis.default.del(`qc:id:${id}:${userId}`);
    await invalidateUserCache(userId);
    await transaction.commit();
    return await import_model.Note.findByPk(id);
  } catch (error) {
    console.error("Error updating quick capture:", error);
    await transaction.rollback();
    throw error;
  }
};
const deleteQuickCaptureService = async (id, userId) => {
  try {
    const note = await import_model.Note.findOne({
      where: { id, user_id: userId, note_type: "quick_capture" },
      raw: true,
      attributes: ["id"]
    });
    if (!note) {
      return false;
    }
    const deletedRows = await import_model.Note.destroy({
      where: { id, user_id: userId }
    });
    if (deletedRows > 0) {
      await import_redis.default.del(`qc:id:${id}:${userId}`);
      await invalidateUserCache(userId);
    }
    return deletedRows > 0;
  } catch (error) {
    console.error("Error deleting quick capture:", error);
    throw error;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createQuickCaptureService,
  deleteQuickCaptureService,
  getAllQuickCapturesService,
  getQuickCaptureByIdService,
  updateQuickCaptureService
});
//# sourceMappingURL=qc.service.js.map
