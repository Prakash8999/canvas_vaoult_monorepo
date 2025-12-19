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
var supported_model_model_exports = {};
__export(supported_model_model_exports, {
  SupportedModel: () => SupportedModel,
  default: () => supported_model_model_default
});
module.exports = __toCommonJS(supported_model_model_exports);
var import_sequelize = require("sequelize");
var import_database = __toESM(require("../../../config/database"));
class SupportedModel extends import_sequelize.Model {
  id;
  provider;
  name;
  description;
  input_cost_per_1k;
  output_cost_per_1k;
  is_enabled;
  created_at;
  updated_at;
}
SupportedModel.init(
  {
    id: {
      type: import_sequelize.DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    provider: {
      type: import_sequelize.DataTypes.STRING,
      allowNull: false
    },
    name: {
      type: import_sequelize.DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: import_sequelize.DataTypes.TEXT
    },
    input_cost_per_1k: {
      type: import_sequelize.DataTypes.DECIMAL(10, 6),
      defaultValue: 0
    },
    output_cost_per_1k: {
      type: import_sequelize.DataTypes.DECIMAL(10, 6),
      defaultValue: 0
    },
    is_enabled: {
      type: import_sequelize.DataTypes.BOOLEAN,
      defaultValue: true
    }
  },
  {
    sequelize: import_database.default,
    tableName: "ai_supported_models",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        unique: true,
        fields: ["provider", "name"]
      }
    ]
  }
);
var supported_model_model_default = SupportedModel;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SupportedModel
});
//# sourceMappingURL=supported-model.model.js.map
