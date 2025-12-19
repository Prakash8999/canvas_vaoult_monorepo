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
var authLogger_exports = {};
__export(authLogger_exports, {
  authLogger: () => authLogger
});
module.exports = __toCommonJS(authLogger_exports);
class AuthLogger {
  static instance;
  logs = [];
  maxLogs = 1e3;
  // Keep last 1000 logs in memory
  constructor() {
  }
  static getInstance() {
    if (!AuthLogger.instance) {
      AuthLogger.instance = new AuthLogger();
    }
    return AuthLogger.instance;
  }
  log(data) {
    const logEntry = {
      ...data,
      timestamp: /* @__PURE__ */ new Date()
    };
    this.logs.unshift(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
    const logLevel = this.getLogLevel(data.action);
    const message = this.formatLogMessage(logEntry);
    switch (logLevel) {
      case "error":
        console.error(message);
        break;
      case "warn":
        console.warn(message);
        break;
      case "info":
        console.info(message);
        break;
      default:
        console.log(message);
    }
    if (this.isCritical(data.action)) {
      console.error(`[CRITICAL AUTH EVENT] ${message}`);
    }
  }
  getLogLevel(action) {
    switch (action) {
      case "LOGIN_FAILED":
      case "TOKEN_INVALID":
      case "AUTH_ERROR":
        return "error";
      case "TOKEN_EXPIRED":
      case "USER_NOT_FOUND":
        return "warn";
      case "LOGIN_SUCCESS":
        return "info";
      default:
        return "debug";
    }
  }
  formatLogMessage(data) {
    const { action, userId, email, ip, url, method, error } = data;
    let message = `[AUTH] ${action}`;
    if (userId)
      message += ` - User: ${userId}`;
    if (email)
      message += ` - Email: ${email}`;
    if (ip)
      message += ` - IP: ${ip}`;
    if (url && method)
      message += ` - ${method} ${url}`;
    if (error)
      message += ` - Error: ${error}`;
    return message;
  }
  isCritical(action) {
    return ["AUTH_ERROR", "LOGIN_FAILED"].includes(action);
  }
  // Get recent auth logs (useful for debugging)
  getRecentLogs(count = 100) {
    return this.logs.slice(0, count);
  }
  // Get logs for specific user
  getUserLogs(userId, count = 50) {
    return this.logs.filter((log) => log.userId === userId).slice(0, count);
  }
  // Get failed login attempts from specific IP
  getFailedAttemptsFromIP(ip, timeWindow = 15 * 60 * 1e3) {
    const cutoff = new Date(Date.now() - timeWindow);
    return this.logs.filter(
      (log) => log.ip === ip && log.action === "LOGIN_FAILED" && log.timestamp && log.timestamp > cutoff
    );
  }
}
const authLogger = AuthLogger.getInstance();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  authLogger
});
//# sourceMappingURL=authLogger.js.map
