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
var user_config_model_exports = {};
__export(user_config_model_exports, {
  UserAIConfig: () => UserAIConfig,
  default: () => user_config_model_default
});
module.exports = __toCommonJS(user_config_model_exports);
var import_sequelize = require("sequelize");
var import_database = __toESM(require("../../../config/database"));
var import_users = __toESM(require("../../users/users.model"));
class UserAIConfig extends import_sequelize.Model {
  id;
  user_id;
  provider;
  model;
  encrypted_api_key;
  is_default;
  created_at;
  updated_at;
}
UserAIConfig.init(
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
    provider: {
      type: import_sequelize.DataTypes.STRING,
      allowNull: false
    },
    model: {
      type: import_sequelize.DataTypes.STRING,
      allowNull: false
    },
    encrypted_api_key: {
      type: import_sequelize.DataTypes.TEXT,
      allowNull: true
    },
    is_default: {
      type: import_sequelize.DataTypes.BOOLEAN,
      defaultValue: false
    }
  },
  {
    sequelize: import_database.default,
    tableName: "ai_user_configs",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);
UserAIConfig.belongsTo(import_users.default, { foreignKey: "user_id", as: "user" });
import_users.default.hasMany(UserAIConfig, { foreignKey: "user_id", as: "aiConfigs" });
var user_config_model_default = UserAIConfig;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  UserAIConfig
});
//# sourceMappingURL=user-config.model.js.map
