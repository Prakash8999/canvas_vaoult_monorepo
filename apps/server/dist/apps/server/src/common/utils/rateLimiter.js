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
var rateLimiter_exports = {};
__export(rateLimiter_exports, {
  authRateLimit: () => authRateLimit,
  createRateLimit: () => createRateLimit,
  generalRateLimit: () => generalRateLimit,
  strictRateLimit: () => strictRateLimit
});
module.exports = __toCommonJS(rateLimiter_exports);
var import_responseHandler = require("../middlewares/responseHandler");
class RateLimiter {
  static instance;
  requests = /* @__PURE__ */ new Map();
  cleanupInterval;
  constructor() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, data] of this.requests.entries()) {
        if (now > data.resetTime) {
          this.requests.delete(key);
        }
      }
    }, 5 * 60 * 1e3);
  }
  static getInstance() {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }
  isAllowed(key, limit, windowMs) {
    const now = Date.now();
    const data = this.requests.get(key);
    if (!data || now > data.resetTime) {
      this.requests.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return true;
    }
    if (data.count >= limit) {
      return false;
    }
    data.count++;
    return true;
  }
  getRemainingRequests(key, limit) {
    const data = this.requests.get(key);
    if (!data || Date.now() > data.resetTime) {
      return limit;
    }
    return Math.max(0, limit - data.count);
  }
  getResetTime(key) {
    const data = this.requests.get(key);
    if (!data || Date.now() > data.resetTime) {
      return null;
    }
    return data.resetTime;
  }
  decrementCount(key) {
    const data = this.requests.get(key);
    if (data && data.count > 0) {
      data.count--;
    }
  }
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}
const rateLimiter = RateLimiter.getInstance();
const createRateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1e3,
    // 15 minutes
    max = 100,
    keyGenerator = (req) => req.ip || "unknown",
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    message = "Too many requests, please try again later."
  } = options;
  return (req, res, next) => {
    const key = keyGenerator(req);
    if (!rateLimiter.isAllowed(key, max, windowMs)) {
      const resetTime2 = rateLimiter.getResetTime(key);
      const retryAfter = resetTime2 ? Math.ceil((resetTime2 - Date.now()) / 1e3) : 0;
      res.set({
        "X-RateLimit-Limit": max.toString(),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": resetTime2 ? Math.ceil(resetTime2 / 1e3).toString() : "",
        "Retry-After": retryAfter.toString()
      });
      (0, import_responseHandler.errorHandler)(res, message, {}, 429);
      return;
    }
    const remaining = rateLimiter.getRemainingRequests(key, max);
    const resetTime = rateLimiter.getResetTime(key);
    res.set({
      "X-RateLimit-Limit": max.toString(),
      "X-RateLimit-Remaining": remaining.toString(),
      "X-RateLimit-Reset": resetTime ? Math.ceil(resetTime / 1e3).toString() : ""
    });
    let shouldCount = true;
    if (skipSuccessfulRequests || skipFailedRequests) {
      const originalSend = res.send;
      res.send = function(data) {
        const statusCode = res.statusCode;
        if (skipSuccessfulRequests && statusCode >= 200 && statusCode < 300) {
          shouldCount = false;
        }
        if (skipFailedRequests && statusCode >= 400) {
          shouldCount = false;
        }
        if (!shouldCount) {
          rateLimiter.decrementCount(key);
        }
        return originalSend.call(this, data);
      };
    }
    next();
  };
};
const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 10,
  // 10 login attempts per 15 minutes
  keyGenerator: (req) => `auth:${req.ip}`,
  message: "Too many authentication attempts, please try again later."
});
const generalRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 1e3,
  // 1000 requests per 15 minutes
  message: "Too many requests, please try again later."
});
const strictRateLimit = createRateLimit({
  windowMs: 1 * 60 * 1e3,
  // 1 minute
  max: 5,
  // 5 requests per minute
  message: "Rate limit exceeded. Please wait before making more requests."
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  authRateLimit,
  createRateLimit,
  generalRateLimit,
  strictRateLimit
});
//# sourceMappingURL=rateLimiter.js.map
