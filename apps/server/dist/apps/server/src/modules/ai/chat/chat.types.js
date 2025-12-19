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
var chat_types_exports = {};
__export(chat_types_exports, {
  CreateChatSchema: () => CreateChatSchema,
  SendMessageSchema: () => SendMessageSchema,
  UpdateChatSchema: () => UpdateChatSchema
});
module.exports = __toCommonJS(chat_types_exports);
var import_zod = require("zod");
const CreateChatSchema = import_zod.z.object({
  title: import_zod.z.string().max(100).optional()
});
const UpdateChatSchema = import_zod.z.object({
  title: import_zod.z.string().max(100)
});
const SendMessageSchema = import_zod.z.object({
  chatId: import_zod.z.number().int().positive(),
  input: import_zod.z.string().min(1).max(2e3),
  // Constraint from validation service
  provider: import_zod.z.string(),
  model: import_zod.z.string(),
  forceSystemKey: import_zod.z.boolean().optional()
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CreateChatSchema,
  SendMessageSchema,
  UpdateChatSchema
});
//# sourceMappingURL=chat.types.js.map
