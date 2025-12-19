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
var ai_route_exports = {};
__export(ai_route_exports, {
  default: () => ai_route_default
});
module.exports = __toCommonJS(ai_route_exports);
var import_express = require("express");
var import_authMiddleware = require("../../common/middlewares/auth/authMiddleware");
var AIController = __toESM(require("./ai.controller"));
var import_chat = __toESM(require("./chat/chat.routes"));
var import_byok = require("./byok/byok.controller");
const router = (0, import_express.Router)();
router.use("/chats", import_chat.default);
router.post("/generate", import_authMiddleware.authUser, AIController.generateAIResponse);
router.get("/credits", import_authMiddleware.authUser, AIController.getCredits);
router.get("/constraints", AIController.getConstraints);
router.get("/models", import_byok.BYOKController.getSupportedModels);
router.get("/config", import_authMiddleware.authUser, import_byok.BYOKController.getUserConfigs);
router.post("/config", import_authMiddleware.authUser, import_byok.BYOKController.setUserConfig);
router.delete("/config", import_authMiddleware.authUser, import_byok.BYOKController.deleteUserConfig);
var ai_route_default = router;
//# sourceMappingURL=ai.route.js.map
