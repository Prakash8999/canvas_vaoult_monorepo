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
var canvas_service_exports = {};
__export(canvas_service_exports, {
  createCanvasService: () => createCanvasService,
  deleteCanvasService: () => deleteCanvasService,
  getAllCanvasesService: () => getAllCanvasesService,
  getCanvasByUidService: () => getCanvasByUidService,
  updateCanvasService: () => updateCanvasService
});
module.exports = __toCommonJS(canvas_service_exports);
var import_sequelize = require("sequelize");
var import_uuid = require("uuid");
var import_model = require("../shared/model/model.relation");
var import_database = __toESM(require("../../config/database"));
var import_redis = __toESM(require("../../config/redis"));
var import_pagination = require("../../common/utils/pagination.utils");
const invalidateUserCache = async (userId) => {
  const trackerKey = `user:${userId}:canvas_cache_tracker`;
  const keysToDelete = await import_redis.default.sMembers(trackerKey);
  if (keysToDelete.length > 0) {
    const pipeline = import_redis.default.multi();
    pipeline.del(keysToDelete);
    pipeline.del(trackerKey);
    await pipeline.exec();
    console.log(`Invalidated ${keysToDelete.length} canvas cache keys for user ${userId}`);
  }
};
const createCanvasService = async (data, userId) => {
  const transaction = await import_database.default.transaction();
  try {
    const canvas_uid = (0, import_uuid.v4)();
    if (data.note_id) {
      const note = await import_model.Note.findOne({
        where: { id: data.note_id, user_id: userId },
        transaction
      });
      if (!note) {
        throw new Error("Associated note not found or does not belong to user");
      }
    }
    const canvasData = {
      ...data,
      user_id: userId,
      canvas_uid,
      created_at: /* @__PURE__ */ new Date(),
      updated_at: /* @__PURE__ */ new Date()
    };
    const canvas = await import_model.Canvas.create(canvasData, { transaction });
    await transaction.commit();
    await invalidateUserCache(userId);
    return canvas;
  } catch (error) {
    await transaction.rollback();
    console.error("Error creating canvas:", error);
    throw error;
  }
};
const getAllCanvasesService = async (userId, filters = {}) => {
  try {
    const {
      search,
      page = 1,
      limit = 10,
      ...modelFilters
    } = filters;
    const offset = (page - 1) * limit;
    const redisKeyGen = `canvases:${userId}:${limit}:${offset}:${search || ""}:${JSON.stringify(modelFilters)}`;
    const trackerKey = `user:${userId}:canvas_cache_tracker`;
    const cachedCanvases = await import_redis.default.get(redisKeyGen);
    if (cachedCanvases) {
      console.log("Canvases found in cache");
      return JSON.parse(cachedCanvases);
    }
    console.log("Canvases not found in cache");
    const whereClause = { user_id: userId };
    if (modelFilters.id !== void 0)
      whereClause.id = modelFilters.id;
    if (modelFilters.canvas_uid !== void 0)
      whereClause.canvas_uid = modelFilters.canvas_uid;
    if (modelFilters.note_id !== void 0)
      whereClause.note_id = modelFilters.note_id;
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
      import_model.Canvas,
      whereClause,
      page,
      limit,
      [["updated_at", "DESC"]],
      [
        {
          model: import_model.Note,
          as: "note",
          attributes: ["id", "title", "note_uid", "created_at", "updated_at"],
          required: false
        }
      ],
      ["id", "canvas_uid", "user_id", "note_id", "title", "pinned", "created_at", "updated_at"]
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
    console.error("Error fetching canvases:", error);
    throw error;
  }
};
const getCanvasByUidService = async (uid, userId) => {
  try {
    const cacheKey = `canvas:${uid}:${userId}`;
    const cachedCanvas = await import_redis.default.get(cacheKey);
    if (cachedCanvas) {
      console.log("Canvas found in cache");
      return JSON.parse(cachedCanvas);
    }
    console.log("Canvas not found in cache");
    const canvas = await import_model.Canvas.findOne({
      where: { canvas_uid: uid, user_id: userId },
      include: [
        {
          model: import_model.Note,
          as: "note",
          attributes: ["id", "title", "note_uid", "content", "created_at", "updated_at"]
        }
      ],
      raw: true,
      nest: true
    });
    if (canvas) {
      await import_redis.default.set(cacheKey, JSON.stringify(canvas), {
        EX: 60 * 30
        // Cache for 30 minutes
      });
    }
    console.log("Fetched canvas by uid:", uid, canvas ? "found" : "not found");
    return canvas;
  } catch (error) {
    console.error("Error fetching canvas:", error);
    throw error;
  }
};
const updateCanvasService = async (id, data, userId) => {
  const transaction = await import_database.default.transaction();
  try {
    const existingCanvas = await import_model.Canvas.findOne({
      where: { id, user_id: userId },
      transaction
    });
    if (!existingCanvas) {
      throw new Error("Canvas not found");
    }
    console.log("note id ", data.note_id);
    if (data.note_id !== void 0 && data.note_id !== null) {
      const note = await import_model.Note.findOne({
        where: { id: data.note_id, user_id: userId },
        transaction
      });
      if (!note) {
        throw new Error("Associated note not found or does not belong to user");
      }
      if (data.document_data) {
        await import_model.Note.update(
          {
            content: data.document_data,
            updated_at: /* @__PURE__ */ new Date()
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
      updated_at: /* @__PURE__ */ new Date()
    };
    await import_model.Canvas.update(updateData, {
      where: { id, user_id: userId },
      transaction
    });
    await import_redis.default.del(`canvas:${existingCanvas.dataValues.canvas_uid}:${userId}`);
    await invalidateUserCache(userId);
    await transaction.commit();
    return await import_model.Canvas.findByPk(id, {
      include: [
        {
          model: import_model.Note,
          as: "note",
          attributes: ["id", "title", "note_uid", "content", "created_at", "updated_at"]
        }
      ],
      raw: true,
      nest: true
    });
  } catch (error) {
    console.error("Error updating canvas:", error);
    await transaction.rollback();
    throw error;
  }
};
const deleteCanvasService = async (id, userId) => {
  try {
    const canvas = await import_model.Canvas.findOne({
      where: { id, user_id: userId },
      raw: true,
      attributes: ["canvas_uid"]
    });
    if (!canvas) {
      return false;
    }
    const deletedRows = await import_model.Canvas.destroy({
      where: { id, user_id: userId }
    });
    if (deletedRows > 0) {
      await import_redis.default.del(`canvas:${canvas.canvas_uid}:${userId}`);
      await invalidateUserCache(userId);
    }
    return deletedRows > 0;
  } catch (error) {
    console.error("Error deleting canvas:", error);
    throw error;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createCanvasService,
  deleteCanvasService,
  getAllCanvasesService,
  getCanvasByUidService,
  updateCanvasService
});
//# sourceMappingURL=canvas.service.js.map
