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
var wikilink_model_exports = {};
__export(wikilink_model_exports, {
  CreateWikiLinkSchema: () => CreateWikiLinkSchema,
  WikiLink: () => WikiLink,
  WikiLinkSchema: () => WikiLinkSchema,
  default: () => wikilink_model_default
});
module.exports = __toCommonJS(wikilink_model_exports);
var import_zod_to_openapi = require("@asteasolutions/zod-to-openapi");
var import_sequelize = require("sequelize");
var import_zod = require("zod");
var import_database = __toESM(require("../../config/database"));
(0, import_zod_to_openapi.extendZodWithOpenApi)(import_zod.z);
const WikiLinkSchema = import_zod.z.object({
  id: import_zod.z.number().int().openapi({
    example: 1,
    description: "Unique identifier for the wiki link"
  }),
  child_note_id: import_zod.z.number().int().openapi({
    example: 1,
    description: "ID of the child note associated with the wiki link"
  }),
  user_id: import_zod.z.number().int().openapi({
    example: 1,
    description: "ID of the user who owns the wiki link"
  }),
  parent_note_id: import_zod.z.number().int().openapi({
    example: 2,
    description: "ID of the parent note associated with the wiki link"
  }),
  created_at: import_zod.z.date().openapi({
    type: "string",
    format: "date-time",
    example: "2023-10-01T12:00:00Z",
    description: "Timestamp when the wiki link was created"
  }),
  updated_at: import_zod.z.date().optional().openapi({
    type: "string",
    format: "date-time",
    example: "2023-10-02T12:00:00Z",
    description: "Timestamp when the wiki link was last updated"
  })
}).openapi({
  title: "WikiLink",
  description: "Schema representing a wiki link between notes"
});
const CreateWikiLinkSchema = WikiLinkSchema.omit({
  id: true,
  user_id: true,
  created_at: true,
  updated_at: true
});
class WikiLink extends import_sequelize.Model {
  id;
  child_note_id;
  user_id;
  parent_note_id;
  created_at;
  updated_at;
}
WikiLink.init(
  {
    id: {
      type: import_sequelize.DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    child_note_id: {
      type: import_sequelize.DataTypes.INTEGER,
      references: {
        model: "notes",
        key: "id"
      }
    },
    user_id: {
      type: import_sequelize.DataTypes.INTEGER,
      references: {
        model: "users",
        key: "id"
      }
    },
    parent_note_id: {
      type: import_sequelize.DataTypes.INTEGER,
      references: {
        model: "notes",
        key: "id"
      }
    },
    created_at: {
      type: import_sequelize.DataTypes.DATE,
      defaultValue: import_sequelize.DataTypes.NOW
    },
    updated_at: {
      type: import_sequelize.DataTypes.DATE,
      defaultValue: import_sequelize.DataTypes.NOW
    }
  },
  {
    sequelize: import_database.default,
    tableName: "wiki_links",
    timestamps: false
  }
);
var wikilink_model_default = WikiLink;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CreateWikiLinkSchema,
  WikiLink,
  WikiLinkSchema
});
//# sourceMappingURL=wikilink.model.js.map
