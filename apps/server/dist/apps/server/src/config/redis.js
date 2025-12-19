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
var redis_exports = {};
__export(redis_exports, {
  connectRedis: () => connectRedis,
  default: () => redis_default
});
module.exports = __toCommonJS(redis_exports);
var import_redis = require("redis");
if (!process.env.REDIS_HOST) {
  console.error("REDIS_HOST is not defined");
  throw new Error("REDIS_HOST is not defined in environment variables");
}
const redisClient = (0, import_redis.createClient)({
  url: process.env.REDIS_HOST
});
redisClient.on("error", (err) => {
  console.error("Redis error:", err);
});
redisClient.on("ready", () => {
  console.log("Redis client ready");
});
const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};
var redis_default = redisClient;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  connectRedis
});
//# sourceMappingURL=redis.js.map
