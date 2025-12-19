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
var notes_service_exports = {};
__export(notes_service_exports, {
  addNoteCreateEvent: () => addNoteCreateEvent,
  addNoteDeleteEvent: () => addNoteDeleteEvent,
  addNoteUpdateEvent: () => addNoteUpdateEvent,
  buildAllTags: () => buildAllTags,
  createNoteService: () => createNoteService,
  deleteNoteService: () => deleteNoteService,
  extractTagsFromContent: () => extractTagsFromContent,
  getAllNotes: () => getAllNotes,
  getAllNotesService: () => getAllNotesService,
  getNoteById: () => getNoteById,
  getNoteByIdService: () => getNoteByIdService,
  getNotesByIds: () => getNotesByIds,
  updateNoteService: () => updateNoteService
});
module.exports = __toCommonJS(notes_service_exports);
var import_sequelize = require("sequelize");
var import_uuid = require("uuid");
var import_model = require("../shared/model/model.relation");
var import_database = __toESM(require("../../config/database"));
var import_redis = __toESM(require("../../config/redis"));
const invalidateUserCache = async (userId) => {
  const trackerKey = `user:${userId}:cache_tracker`;
  const keysToDelete = await import_redis.default.sMembers(trackerKey);
  if (keysToDelete.length > 0) {
    const pipeline = import_redis.default.multi();
    pipeline.del(keysToDelete);
    pipeline.del(trackerKey);
    await pipeline.exec();
    console.log(`Invalidated ${keysToDelete.length} cache keys for user ${userId}`);
  }
};
const createNoteService = async (data, userId) => {
  try {
    const note_uid = (0, import_uuid.v4)();
    const noteData = {
      ...data,
      user_id: userId,
      note_type: "note",
      version: 1,
      note_uid,
      created_at: /* @__PURE__ */ new Date(),
      updated_at: /* @__PURE__ */ new Date()
    };
    if (data.is_wiki_link) {
      if (!data.parent_note_id) {
        throw new Error("Parent note ID is required when creating a wiki link");
      }
      const transaction = await import_database.default.transaction();
      try {
        const note = await import_model.Note.create(noteData, { transaction });
        await import_model.WikiLink.create({
          user_id: userId,
          parent_note_id: data.parent_note_id,
          child_note_id: note.dataValues.id,
          created_at: /* @__PURE__ */ new Date(),
          updated_at: /* @__PURE__ */ new Date()
        }, { transaction });
        await transaction.commit();
        await invalidateUserCache(userId);
        return note;
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } else {
      const note = await import_model.Note.create(noteData);
      await invalidateUserCache(userId);
      return note;
    }
  } catch (error) {
    console.error("Error creating note:", error);
    throw error;
  }
};
const extractTagsFromContent = (content) => {
  if (!content?.blocks)
    return [];
  const tags = [];
  const tagRegex = /#([a-zA-Z0-9_]+)/g;
  for (const block of content.blocks) {
    let text = "";
    if (block.data?.text) {
      text = block.data.text;
    }
    if (block.type === "list" && Array.isArray(block.data?.items)) {
      block.data.items.forEach((item) => {
        if (typeof item.content === "string") {
          text += " " + item.content;
        }
      });
    }
    let match;
    while ((match = tagRegex.exec(text)) !== null) {
      tags.push(match[1].toLowerCase());
    }
  }
  return Array.from(tags);
};
function buildAllTags(notes) {
  const tagMap = {};
  for (const note of notes) {
    const uniqueTags = new Set(note.tags);
    for (const tag of uniqueTags) {
      if (!tagMap[tag])
        tagMap[tag] = [];
      if (!tagMap[tag].some((n) => n.note_id === note.id)) {
        tagMap[tag].push({
          note_name: note.title,
          note_uid: note.note_uid,
          note_id: note.id,
          created_at: note.created_at,
          updated_at: note.updated_at
        });
      }
    }
  }
  return Object.entries(tagMap).map(([tag, notes2]) => ({
    tag,
    notes: notes2
  }));
}
const getAllNotesService = async (userId, limit, offset, search, isWikilink = false, isGraph = false, isPinned = false) => {
  try {
    const redisKeyGen = `notes:${userId}:${limit}:${offset || 0}:${search || ""}:${isWikilink}:${isGraph}:${isPinned}`;
    const trackerKey = `user:${userId}:cache_tracker`;
    const cachedNotes = await import_redis.default.get(redisKeyGen);
    if (cachedNotes) {
      console.log("Notes found in cache");
      return JSON.parse(cachedNotes);
    }
    console.log("Notes does not found in cache");
    const whereClause = { user_id: userId, note_type: "note" };
    if (search) {
      whereClause.title = isWikilink ? search : { [import_sequelize.Op.iLike]: `%${search}%` };
    }
    if (isPinned) {
      whereClause.pinned = true;
    }
    const includeOptions = isGraph ? [
      {
        model: import_model.WikiLink,
        as: "parent_wikilinks",
        include: [{
          model: import_model.Note,
          as: "parent_note",
          attributes: ["id", "title", "note_uid", "created_at", "updated_at"]
        }]
      },
      {
        model: import_model.WikiLink,
        as: "child_wikilinks",
        include: [{
          model: import_model.Note,
          as: "child_note",
          attributes: ["id", "title", "note_uid", "created_at", "updated_at"]
        }]
      }
    ] : [];
    const { count, rows } = await import_model.Note.findAndCountAll({
      where: whereClause,
      order: [["updated_at", "DESC"]],
      limit: limit || 50,
      offset: offset || 0,
      attributes: isWikilink ? { exclude: ["content"] } : void 0,
      include: includeOptions,
      raw: true,
      nest: true
    });
    const responseData = { notes: rows, total: count };
    const pipeline = import_redis.default.multi();
    pipeline.set(redisKeyGen, JSON.stringify(responseData), {
      EX: 60 * 60
    });
    pipeline.sAdd(trackerKey, redisKeyGen);
    pipeline.expire(trackerKey, 60 * 60);
    await pipeline.exec();
    return { notes: rows, total: count };
  } catch (error) {
    console.error("Error fetching notes:", error);
    throw error;
  }
};
const getNoteByIdService = async (uid, userId) => {
  try {
    const cacheKey = `note:${uid}:${userId}`;
    const cachedNote = await import_redis.default.get(cacheKey);
    if (cachedNote) {
      console.log("Note found in cache");
      return JSON.parse(cachedNote);
    }
    console.log("Note does not found in cache");
    const note = await import_model.Note.findOne({
      where: { note_uid: uid, user_id: userId, note_type: "note" },
      include: [
        {
          model: import_model.WikiLink,
          as: "parent_wikilinks",
          include: [{
            model: import_model.Note,
            as: "parent_note",
            attributes: ["id", "title", "note_uid", "created_at", "updated_at"]
          }]
        },
        {
          model: import_model.WikiLink,
          as: "child_wikilinks",
          include: [{
            model: import_model.Note,
            as: "child_note",
            attributes: ["id", "title", "note_uid", "created_at", "updated_at"]
          }]
        }
      ],
      raw: true,
      nest: true
    });
    if (note) {
      await import_redis.default.set(cacheKey, JSON.stringify(note), {
        EX: 60 * 30
        // Cache for 30 minutes
      });
    }
    console.log("Fetched note by uid:", uid, note ? "found" : "not found");
    return note;
  } catch (error) {
    console.error("Error fetching note:", error);
    throw error;
  }
};
const updateNoteService = async (id, data, userId) => {
  const transaction = await import_database.default.transaction();
  try {
    const existingNote = await import_model.Note.findOne({
      where: { id, user_id: userId, note_type: "note" },
      transaction
    });
    if (!existingNote) {
      throw new Error("Note not found");
    }
    const currentVersion = existingNote.dataValues.version || 0;
    const updateData = {
      ...data,
      version: currentVersion + 1,
      updated_at: /* @__PURE__ */ new Date()
    };
    if (data.is_wiki_link && !data.child_note_id) {
      throw new Error("Child note ID is required when updating a wiki link");
    }
    await import_model.Note.update(updateData, {
      where: { id, user_id: userId },
      transaction
    });
    if (data.is_wiki_link && data.child_note_id) {
      await import_model.WikiLink.create(
        {
          user_id: userId,
          parent_note_id: id,
          child_note_id: data.child_note_id,
          created_at: /* @__PURE__ */ new Date(),
          updated_at: /* @__PURE__ */ new Date()
        },
        { transaction }
      );
    }
    await import_redis.default.del(`note:${existingNote.dataValues.note_uid}:${userId}`);
    await invalidateUserCache(userId);
    await transaction.commit();
    return await import_model.Note.findByPk(id);
  } catch (error) {
    console.error("Error updating note:", error);
    await transaction.rollback();
    throw error;
  }
};
const deleteNoteService = async (id, userId) => {
  try {
    const note = await import_model.Note.findOne({
      where: { id, user_id: userId, note_type: "note" },
      raw: true,
      attributes: ["note_uid"]
    });
    if (!note) {
      return false;
    }
    const deletedRows = await import_model.Note.destroy({
      where: { id, user_id: userId }
    });
    if (deletedRows > 0) {
      await import_redis.default.del(`note:${note.note_uid}:${userId}`);
      await invalidateUserCache(userId);
    }
    return deletedRows > 0;
  } catch (error) {
    console.error("Error deleting note:", error);
    throw error;
  }
};
const addNoteCreateEvent = async (data, userId) => {
  const note = await createNoteService(data, userId);
  return { success: true, note };
};
const addNoteUpdateEvent = async (id, data) => {
  try {
    const [affectedRows] = await import_model.Note.update(data, {
      where: { id }
    });
    if (affectedRows === 0) {
      throw new Error("Note not found or no changes made");
    }
    const updatedNote = await import_model.Note.findByPk(id);
    return { success: true, note: updatedNote };
  } catch (error) {
    console.error("Error updating note:", error);
    throw error;
  }
};
const addNoteDeleteEvent = async (id) => {
  try {
    const deletedRows = await import_model.Note.destroy({
      where: { id }
    });
    if (deletedRows === 0) {
      throw new Error("Note not found");
    }
    return { success: true, deletedId: id };
  } catch (error) {
    console.error("Error deleting note:", error);
    throw error;
  }
};
const getNoteById = async (id) => {
  try {
    const note = await import_model.Note.findByPk(id);
    return note;
  } catch (error) {
    console.error("Error fetching note:", error);
    throw error;
  }
};
const getAllNotes = async (userId) => {
  try {
    const whereClause = userId ? { user_id: userId } : {};
    const notes = await import_model.Note.findAll({
      where: whereClause,
      order: [["updated_at", "DESC"]]
    });
    return notes;
  } catch (error) {
    console.error("Error fetching notes:", error);
    throw error;
  }
};
const getNotesByIds = async (ids) => {
  try {
    const notes = await import_model.Note.findAll({
      where: {
        id: {
          [import_sequelize.Op.in]: ids
        }
      }
    });
    return notes;
  } catch (error) {
    console.error("Error fetching notes by IDs:", error);
    throw error;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  addNoteCreateEvent,
  addNoteDeleteEvent,
  addNoteUpdateEvent,
  buildAllTags,
  createNoteService,
  deleteNoteService,
  extractTagsFromContent,
  getAllNotes,
  getAllNotesService,
  getNoteById,
  getNoteByIdService,
  getNotesByIds,
  updateNoteService
});
//# sourceMappingURL=notes.service.js.map
