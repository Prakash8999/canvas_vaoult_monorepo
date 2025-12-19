"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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
var import_express = __toESM(require("express"));
var import_swagger_ui_express = __toESM(require("swagger-ui-express"));
var import_docs = require("./common/docs");
var import_cors = __toESM(require("cors"));
var import_dotenv = __toESM(require("dotenv"));
var import_cookie_parser = __toESM(require("cookie-parser"));
var import_user = __toESM(require("./modules/users/user.route"));
var import_asset = __toESM(require("./modules/assets/asset.route"));
var import_notes = __toESM(require("./modules/notes/notes.route"));
var import_canvas = __toESM(require("./modules/canvas/canvas.routes"));
var import_qc = __toESM(require("./modules/quick-capture/qc.routes"));
var import_ai = __toESM(require("./modules/ai/ai.route"));
var import_redis = __toESM(require("./config/redis"));
var import_otp = require("./jobs/otp.worker");
import_dotenv.default.config();
const app = (0, import_express.default)();
app.use(import_express.default.json({ limit: "50mb" }));
app.use(import_express.default.urlencoded({ extended: true, limit: "50mb" }));
app.use((0, import_cookie_parser.default)());
app.use(
  (0, import_cors.default)({
    origin: [
      "http://localhost:8080",
      "https://canvas-note.vercel.app"
    ],
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true
  })
);
async function initApp() {
  try {
    await (0, import_redis.connectRedis)();
    const result = await import_redis.default.ping();
    console.log("Redis connected:", result);
  } catch (err) {
    console.error("Redis connection failed:", err);
  }
}
initApp();
app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "canvas-vault-api" });
});
app.use("/api-docs", import_swagger_ui_express.default.serve, import_swagger_ui_express.default.setup(import_docs.combinedOpenApiDoc));
const apiV1 = "/api/v1";
app.use(`${apiV1}/user`, import_user.default);
app.use(`${apiV1}/assets`, import_asset.default);
app.use(`${apiV1}/note`, import_notes.default);
app.use(`${apiV1}/canvas`, import_canvas.default);
app.use(`${apiV1}/quick-capture`, import_qc.default);
app.use(`${apiV1}/ai`, import_ai.default);
const port = process.env.PORT ? Number(process.env.PORT) : 3e3;
app.listen(port, () => {
  console.log(`[ ready ] http://localhost:${port}`);
});
//# sourceMappingURL=server.js.map
