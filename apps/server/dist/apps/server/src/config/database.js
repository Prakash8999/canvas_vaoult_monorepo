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
var database_exports = {};
__export(database_exports, {
  default: () => database_default
});
module.exports = __toCommonJS(database_exports);
var import_sequelize = require("sequelize");
if (!process.env.PSQL_URI) {
  throw new Error("PSQL_URI is not defined");
}
const sequelize = new import_sequelize.Sequelize(process.env.PSQL_URI, {
  dialect: "postgres",
  logging: true
});
const syncDb = { force: false, alter: false };
sequelize.sync(syncDb).then(() => {
  console.log("DB connected");
}).catch((err) => {
  console.log("Error: ", err);
});
var database_default = sequelize;
//# sourceMappingURL=database.js.map
