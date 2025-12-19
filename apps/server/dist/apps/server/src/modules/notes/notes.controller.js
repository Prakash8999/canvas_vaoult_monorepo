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
var notes_controller_exports = {};
__export(notes_controller_exports, {
  createNote: () => createNote,
  deleteNote: () => deleteNote,
  getAllNotes: () => getAllNotes,
  getAllTags: () => getAllTags,
  getNote: () => getNote,
  updateNote: () => updateNote
});
module.exports = __toCommonJS(notes_controller_exports);
var import_responseHandler = require("../../common/middlewares/responseHandler");
var import_error = require("../../common/utils/error.parser");
var noteService = __toESM(require("./notes.service"));
var import_notes = require("./notes.service");
const createNote = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      (0, import_responseHandler.errorHandler)(res, "Unauthorized", {}, 401);
      return;
    }
    const userId = req.user.userId;
    const note = await noteService.createNoteService(req.body, userId);
    (0, import_responseHandler.successHandler)(res, "Note created successfully", note, 201);
  } catch (error) {
    console.error("Error creating note:", error);
    const errorParser = (0, import_error.parseError)(error);
    (0, import_responseHandler.errorHandler)(res, "Failed to create note", errorParser.message, errorParser.statusCode);
  }
};
const getAllNotes = async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;
    const search = req.query.search ? req.query.search : void 0;
    const isWikilink = req.query.isWikiLink === "true" || req.query.isWikiLink ? true : false;
    const isGraph = req.query.isGraph === "true" || req.query.isGraph ? true : false;
    const isPinned = req.query.isPinned === "true" || req.query.isPinned ? true : false;
    const { notes, total } = await noteService.getAllNotesService(userId, limit, offset, search, isWikilink, isGraph, isPinned);
    const mappedNotes = notes.map((note) => {
      const extractedTags = noteService.extractTagsFromContent(note.content);
      return {
        id: note.id,
        title: note.title,
        content: note.content,
        tags: extractedTags,
        note_uid: note.note_uid,
        version: note.version,
        pinned: note.pinned,
        child_wikilinks: note.child_wikilinks || [],
        parent_wikilinks: note.parent_wikilinks || [],
        created_at: note.created_at,
        updated_at: note.updated_at
      };
    });
    const responseData = {
      notes: mappedNotes,
      pagination: {
        total,
        limit,
        remaining: total - (offset + limit),
        currentNoteCount: notes.length,
        offset,
        pageNum: Math.floor(offset / limit) + 1,
        hasMore: offset + limit < total
      }
    };
    return (0, import_responseHandler.successHandler)(res, "Notes fetched successfully", responseData, 200);
  } catch (error) {
    console.log("Error fetching notes:", error);
    const errorParser = (0, import_error.parseError)(error);
    return (0, import_responseHandler.errorHandler)(res, "Failed to fetch notes", errorParser.message, errorParser.statusCode);
  }
};
const getAllTags = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const offset = (page - 1) * limit;
    const { notes } = await noteService.getAllNotesService(userId);
    const mappedNotes = notes.map((note) => ({
      id: note.dataValues.id,
      title: note.dataValues.title,
      note_uid: note.dataValues.note_uid,
      tags: noteService.extractTagsFromContent(note.dataValues.content),
      created_at: note.dataValues.created_at,
      updated_at: note.dataValues.updated_at
    }));
    const allTags = (0, import_notes.buildAllTags)(mappedNotes);
    const paginatedTags = allTags.slice(offset, offset + limit);
    return (0, import_responseHandler.successHandler)(res, "Tags fetched successfully", {
      tags: paginatedTags,
      total: allTags.length,
      page,
      limit
    }, 200);
  } catch (error) {
    const parsed = (0, import_error.parseError)(error);
    return (0, import_responseHandler.errorHandler)(res, "Failed to fetch tags", parsed.message, parsed.statusCode);
  }
};
const getNote = async (req, res) => {
  try {
    const userId = req.user.userId;
    const uid = req.params.uid;
    console.log("Fetching note with uid:", uid, "for userId:", userId);
    console.log("req.params ", req.params);
    const note = await noteService.getNoteByIdService(uid, userId);
    if (!note) {
      return (0, import_responseHandler.errorHandler)(res, "Note not found", {}, 404);
    }
    const extractedTags = noteService.extractTagsFromContent(note.content);
    return (0, import_responseHandler.successHandler)(res, "Note fetched successfully", {
      id: note.id,
      title: note.title,
      userId: note.user_id,
      content: note.content,
      tags: extractedTags,
      version: note.version,
      note_uid: note.note_uid,
      pinned: note.pinned,
      created_at: note.created_at,
      updated_at: note.updated_at,
      child_wikilinks: note.child_wikilinks,
      parent_wikilinks: note.parent_wikilinks
    }, 200);
  } catch (error) {
    const errorParser = (0, import_error.parseError)(error);
    return (0, import_responseHandler.errorHandler)(res, "Failed to fetch note", errorParser.message, errorParser.statusCode);
  }
};
const updateNote = async (req, res) => {
  try {
    const userId = req.user.userId;
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return (0, import_responseHandler.errorHandler)(res, "Invalid note ID", {}, 400);
    }
    console.log("Updating body ", req.body);
    const note = await noteService.updateNoteService(id, req.body, userId);
    if (!note) {
      return (0, import_responseHandler.errorHandler)(res, "Note not found", {}, 404);
    }
    return (0, import_responseHandler.successHandler)(res, "Note updated successfully", {
      id: note.id,
      title: note.title,
      content: note.content,
      tags: note.tags,
      version: note.version,
      pinned: note.pinned,
      created_at: note.created_at,
      updated_at: note.updated_at
    }, 200);
  } catch (error) {
    console.error("Error updating note:", error);
    const errorParser = (0, import_error.parseError)(error);
    return (0, import_responseHandler.errorHandler)(res, "Failed to update note", errorParser.message, errorParser.statusCode);
  }
};
const deleteNote = async (req, res) => {
  try {
    const userId = req.user.userId;
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return (0, import_responseHandler.errorHandler)(res, "Invalid note ID", {}, 400);
    }
    const deleted = await noteService.deleteNoteService(id, userId);
    if (!deleted) {
      return (0, import_responseHandler.errorHandler)(res, "Note not found", {}, 404);
    }
    return (0, import_responseHandler.successHandler)(res, "Note deleted successfully", { deletedId: id }, 200);
  } catch (error) {
    const errorParser = (0, import_error.parseError)(error);
    return (0, import_responseHandler.errorHandler)(res, "Failed to delete note", errorParser.message, errorParser.statusCode);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createNote,
  deleteNote,
  getAllNotes,
  getAllTags,
  getNote,
  updateNote
});
//# sourceMappingURL=notes.controller.js.map
