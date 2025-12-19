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
var chat_service_exports = {};
__export(chat_service_exports, {
  ChatService: () => ChatService
});
module.exports = __toCommonJS(chat_service_exports);
var import_chat = __toESM(require("./models/chat.model"));
var import_message = __toESM(require("./models/message.model"));
class ChatService {
  /**
   * Create a new chat for a user
   */
  static async createChat(userId, title = "New Chat") {
    return import_chat.default.create({
      user_id: userId,
      title
    });
  }
  /**
   * Get all chats for a user, sorted by last activity
   */
  static async getUserChats(userId, limit = 10, offset = 0) {
    return import_chat.default.findAll({
      where: { user_id: userId },
      order: [["last_message_at", "DESC"]],
      limit,
      offset
    });
  }
  /**
   * Get a specific chat by ID (ensuring user ownership)
   */
  static async getChatById(chatId, userId) {
    return import_chat.default.findOne({
      where: { id: chatId, user_id: userId },
      include: [
        {
          model: import_message.default,
          as: "messages",
          order: [["created_at", "ASC"]]
        }
      ]
    });
  }
  /**
   * Update chat metadata (e.g. title)
   */
  static async updateChat(chatId, userId, data) {
    const chat = await import_chat.default.findOne({
      where: { id: chatId, user_id: userId }
    });
    if (!chat)
      return null;
    console.log(`[ChatService] Updating chat ${chatId} title to: ${data.title}`);
    await chat.update({ title: data.title });
    await chat.reload();
    return chat;
  }
  /**
   * Delete a chat and all its messages
   */
  static async deleteChat(chatId, userId) {
    const result = await import_chat.default.destroy({
      where: { id: chatId, user_id: userId }
    });
    return result > 0;
  }
  /**
   * Save a message to a chat
   */
  static async saveMessage(chatId, role, content, metadata) {
    const message = await import_message.default.create({
      chat_id: chatId,
      role,
      content,
      provider: metadata?.provider,
      model: metadata?.model,
      tokens_used: metadata?.tokensUsed
    });
    await import_chat.default.update(
      { last_message_at: /* @__PURE__ */ new Date(), updated_at: /* @__PURE__ */ new Date() },
      { where: { id: chatId } }
    );
    return message;
  }
  /**
   * Get messages for a specific chat
   */
  static async getMessages(chatId) {
    return import_message.default.findAll({
      where: { chat_id: chatId },
      order: [["created_at", "ASC"]]
    });
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ChatService
});
//# sourceMappingURL=chat.service.js.map
