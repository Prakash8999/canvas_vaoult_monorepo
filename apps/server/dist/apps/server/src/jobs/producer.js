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
var producer_exports = {};
__export(producer_exports, {
  otpQueue: () => otpQueue
});
module.exports = __toCommonJS(producer_exports);
var import_bullmq = require("bullmq");
const otpQueue = new import_bullmq.Queue("send-otp", { connection: { url: process.env.REDIS_HOST }, defaultJobOptions: {
  removeOnComplete: true,
  removeOnFail: { age: 3600 }
} });
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  otpQueue
});
//# sourceMappingURL=producer.js.map
