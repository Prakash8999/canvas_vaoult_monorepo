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
var authToken_model_exports = {};
__export(authToken_model_exports, {
  AuthToken: () => AuthToken,
  default: () => authToken_model_default
});
module.exports = __toCommonJS(authToken_model_exports);
var import_sequelize = require("sequelize");
var import_database = __toESM(require("../../../../config/database"));
class AuthToken extends import_sequelize.Model {
  id;
  user_id;
  token_hash;
  ip_address;
  user_agent;
  revoked;
  replaced_by_token_id;
  expires_at;
  created_at;
  updated_at;
}
AuthToken.init(
  {
    id: {
      type: import_sequelize.DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: import_sequelize.DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    token_hash: {
      type: import_sequelize.DataTypes.STRING(255),
      allowNull: false
    },
    ip_address: {
      type: import_sequelize.DataTypes.STRING(64),
      allowNull: true
    },
    user_agent: {
      type: import_sequelize.DataTypes.STRING(512),
      allowNull: true
    },
    revoked: {
      type: import_sequelize.DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    replaced_by_token_id: {
      type: import_sequelize.DataTypes.INTEGER.UNSIGNED,
      allowNull: true
    },
    expires_at: {
      type: import_sequelize.DataTypes.DATE,
      allowNull: false
    },
    created_at: {
      type: import_sequelize.DataTypes.DATE,
      allowNull: false,
      defaultValue: import_sequelize.DataTypes.NOW
    },
    updated_at: {
      type: import_sequelize.DataTypes.DATE,
      allowNull: false,
      defaultValue: import_sequelize.DataTypes.NOW
    }
  },
  {
    sequelize: import_database.default,
    tableName: "auth_tokens",
    timestamps: false,
    underscored: true
  }
);
var authToken_model_default = AuthToken;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AuthToken
});
//# sourceMappingURL=authToken.model.js.map
