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
var message_model_exports = {};
__export(message_model_exports, {
  Message: () => Message,
  default: () => message_model_default
});
module.exports = __toCommonJS(message_model_exports);
var import_sequelize = require("sequelize");
var import_database = __toESM(require("../../../../config/database"));
var import_chat = __toESM(require("./chat.model"));
class Message extends import_sequelize.Model {
  id;
  chat_id;
  role;
  content;
  provider;
  model;
  tokens_used;
  created_at;
}
Message.init(
  {
    id: {
      type: import_sequelize.DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    chat_id: {
      type: import_sequelize.DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: import_chat.default,
        key: "id"
      }
    },
    role: {
      type: import_sequelize.DataTypes.ENUM("user", "assistant"),
      allowNull: false
    },
    content: {
      type: import_sequelize.DataTypes.TEXT,
      allowNull: false
    },
    provider: {
      type: import_sequelize.DataTypes.STRING,
      allowNull: true
    },
    model: {
      type: import_sequelize.DataTypes.STRING,
      allowNull: true
    },
    tokens_used: {
      type: import_sequelize.DataTypes.INTEGER,
      defaultValue: 0
    }
  },
  {
    sequelize: import_database.default,
    tableName: "ai_messages",
    timestamps: true,
    updatedAt: false,
    // Messages are immutable
    createdAt: "created_at"
  }
);
Message.belongsTo(import_chat.default, { foreignKey: "chat_id", as: "chat" });
import_chat.default.hasMany(Message, { foreignKey: "chat_id", as: "messages", onDelete: "CASCADE" });
var message_model_default = Message;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Message
});
//# sourceMappingURL=message.model.js.map
