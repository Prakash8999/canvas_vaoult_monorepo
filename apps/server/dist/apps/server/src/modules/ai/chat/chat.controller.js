"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var chat_controller_exports = {};
__export(chat_controller_exports, {
  ChatController: () => ChatController
});
module.exports = __toCommonJS(chat_controller_exports);
var import_chat = require("./chat.service");
var import_ai = require("../services/ai.service");
var import_chat2 = require("./chat.types");
class ChatController {
  // -----------------------------
  // Chat CRUD
  // -----------------------------
  /**
   * Create a new chat
   */
  static async createChat(req, res, next) {
    try {
      const userId = req.user.userId;
      const validated = import_chat2.CreateChatSchema.parse(req.body);
      const chat = await import_chat.ChatService.createChat(userId, validated.title);
      res.status(201).json({
        success: true,
        data: chat
      });
    } catch (error) {
      next(error);
    }
  }
  /**
   * Get all chats for the user
   */
  static async getChats(req, res, next) {
    try {
      const userId = req.user.userId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const chats = await import_chat.ChatService.getUserChats(userId, limit, offset);
      res.json({
        success: true,
        data: chats
      });
    } catch (error) {
      next(error);
    }
  }
  /**
   * Update chat metadata
   */
  static async updateChat(req, res, next) {
    try {
      const userId = req.user.userId;
      const chatId = parseInt(req.params.id);
      const validated = import_chat2.UpdateChatSchema.parse(req.body);
      const chat = await import_chat.ChatService.updateChat(chatId, userId, validated);
      if (!chat) {
        res.status(404).json({ success: false, message: "Chat not found" });
        return;
      }
      res.json({
        success: true,
        data: chat
      });
    } catch (error) {
      next(error);
    }
  }
  /**
   * Delete a chat
   */
  static async deleteChat(req, res, next) {
    try {
      const userId = req.user.userId;
      const chatId = parseInt(req.params.id);
      const success = await import_chat.ChatService.deleteChat(chatId, userId);
      if (!success) {
        res.status(404).json({ success: false, message: "Chat not found" });
        return;
      }
      res.json({
        success: true,
        message: "Chat deleted successfully"
      });
    } catch (error) {
      next(error);
    }
  }
  /**
   * Get messages for a specific chat
   */
  static async getMessages(req, res, next) {
    try {
      const userId = req.user.userId;
      const chatId = parseInt(req.params.id);
      const chat = await import_chat.ChatService.getChatById(chatId, userId);
      if (!chat) {
        res.status(404).json({ success: false, message: "Chat not found" });
        return;
      }
      res.json({
        success: true,
        data: chat.dataValues.messages || []
      });
    } catch (error) {
      next(error);
    }
  }
  // -----------------------------
  // AI Interaction
  // -----------------------------
  /**
   * Send a message to AI and update chat history
   */
  static async sendMessage(req, res, next) {
    try {
      const userId = req.user.userId;
      const { chatId, input, provider, model, forceSystemKey } = import_chat2.SendMessageSchema.parse(req.body);
      const chat = await import_chat.ChatService.getChatById(chatId, userId);
      if (!chat) {
        res.status(404).json({ success: false, message: "Chat not found" });
        return;
      }
      const userMsg = await import_chat.ChatService.saveMessage(chatId, "user", input);
      const aiRequest = {
        provider,
        model,
        input
      };
      const aiResponse = await import_ai.AIService.executeRequest(userId, aiRequest, forceSystemKey);
      const assistantMsg = await import_chat.ChatService.saveMessage(chatId, "assistant", aiResponse.content, {
        provider: aiResponse.provider,
        model: aiResponse.model,
        tokensUsed: aiResponse.tokensUsed
      });
      res.json({
        success: true,
        data: {
          userMessage: userMsg,
          assistantMessage: assistantMsg,
          remainingCredits: aiResponse.remainingCredits,
          creditsUsed: aiResponse.creditsUsed,
          usingCustomKey: aiResponse.usingCustomKey
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ChatController
});
//# sourceMappingURL=chat.controller.js.map
