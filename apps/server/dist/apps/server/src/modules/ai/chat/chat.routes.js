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
var chat_routes_exports = {};
__export(chat_routes_exports, {
  default: () => chat_routes_default
});
module.exports = __toCommonJS(chat_routes_exports);
var import_express = require("express");
var import_chat = require("./chat.controller");
var import_authMiddleware = require("../../../common/middlewares/auth/authMiddleware");
const router = (0, import_express.Router)();
router.use(import_authMiddleware.authUser);
router.post("/", import_chat.ChatController.createChat);
router.get("/", import_chat.ChatController.getChats);
router.get("/:id/messages", import_chat.ChatController.getMessages);
router.patch("/:id", import_chat.ChatController.updateChat);
router.delete("/:id", import_chat.ChatController.deleteChat);
router.post("/message", import_chat.ChatController.sendMessage);
var chat_routes_default = router;
//# sourceMappingURL=chat.routes.js.map
