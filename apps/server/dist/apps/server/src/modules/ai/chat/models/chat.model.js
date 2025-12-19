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
var chat_model_exports = {};
__export(chat_model_exports, {
  Chat: () => Chat,
  default: () => chat_model_default
});
module.exports = __toCommonJS(chat_model_exports);
var import_sequelize = require("sequelize");
var import_database = __toESM(require("../../../../config/database"));
var import_users = __toESM(require("../../../users/users.model"));
class Chat extends import_sequelize.Model {
  id;
  user_id;
  title;
  created_at;
  updated_at;
  last_message_at;
}
Chat.init(
  {
    id: {
      type: import_sequelize.DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: import_sequelize.DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: import_users.default,
        key: "id"
      }
    },
    title: {
      type: import_sequelize.DataTypes.STRING,
      allowNull: false,
      defaultValue: "New Chat"
    },
    last_message_at: {
      type: import_sequelize.DataTypes.DATE,
      defaultValue: import_sequelize.DataTypes.NOW
    }
  },
  {
    sequelize: import_database.default,
    tableName: "ai_chats",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);
Chat.belongsTo(import_users.default, { foreignKey: "user_id", as: "user" });
import_users.default.hasMany(Chat, { foreignKey: "user_id", as: "chats" });
var chat_model_default = Chat;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Chat
});
//# sourceMappingURL=chat.model.js.map
