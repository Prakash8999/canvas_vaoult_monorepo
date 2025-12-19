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
var user_docs_exports = {};
__export(user_docs_exports, {
  registry: () => registry,
  userOpenApiDoc: () => userOpenApiDoc
});
module.exports = __toCommonJS(user_docs_exports);
var import_zod_to_openapi = require("@asteasolutions/zod-to-openapi");
var import_users = require("./users.model");
var import_zod = require("zod");
const registry = new import_zod_to_openapi.OpenAPIRegistry();
registry.register("User", import_users.UserSchema);
registry.register("UserCreate", import_users.CreateUserSchema);
registry.register("UserProfileUpdate", import_users.UpdateUserSchema);
registry.register("UserOtpVerify", import_users.UserOtpVerifySchema);
const UserLoginSchema = import_zod.z.object({
  email: import_zod.z.string().email(),
  password: import_zod.z.string().min(1)
});
registry.register("UserLogin", UserLoginSchema);
const TokenResponseSchema = import_zod.z.object({ token: import_zod.z.string() });
registry.register("TokenResponse", TokenResponseSchema);
registry.registerPath({
  method: "post",
  path: "/api/v1/user/signup",
  tags: ["User"],
  summary: "Create a new user (signup)",
  request: {
    body: {
      content: {
        "application/json": { schema: import_users.CreateUserSchema }
      }
    }
  },
  responses: {
    201: {
      description: "User created successfully",
      content: {
        "application/json": { schema: import_users.UserSchema }
      }
    },
    400: { description: "Invalid request" }
  }
});
registry.registerPath({
  method: "post",
  path: "/api/v1/user/verify-otp",
  tags: ["User"],
  summary: "Verify OTP and return auth token",
  request: {
    body: {
      content: {
        "application/json": { schema: import_users.UserOtpVerifySchema }
      }
    }
  },
  responses: {
    200: {
      description: "OTP verified, returns token",
      content: {
        "application/json": { schema: TokenResponseSchema }
      }
    },
    400: { description: "Invalid OTP or request" }
  }
});
registry.registerPath({
  method: "post",
  path: "/api/v1/user/login",
  tags: ["User"],
  summary: "User login (email + password)",
  request: {
    body: {
      content: {
        "application/json": { schema: UserLoginSchema }
      }
    }
  },
  responses: {
    200: {
      description: "Login successful, returns token",
      content: {
        "application/json": { schema: TokenResponseSchema }
      }
    },
    401: { description: "Invalid credentials" }
  }
});
registry.registerPath({
  method: "get",
  path: "/api/v1/user",
  tags: ["User"],
  summary: "Get current user's profile",
  // mark this operation as protected by the bearerAuth scheme
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "User profile",
      content: {
        "application/json": { schema: import_users.UserSchema }
      }
    },
    401: { description: "Unauthorized" }
  }
});
registry.registerPath({
  method: "patch",
  path: "/api/v1/user",
  tags: ["User"],
  summary: "Update current user's profile",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: import_users.UpdateUserSchema }
      }
    }
  },
  responses: {
    200: {
      description: "Updated user profile",
      content: {
        "application/json": { schema: import_users.UserSchema }
      }
    },
    400: { description: "Invalid request" },
    401: { description: "Unauthorized" }
  }
});
registry.registerPath({
  method: "delete",
  path: "/api/v1/user",
  tags: ["User"],
  summary: "Block or delete current user",
  security: [{ bearerAuth: [] }],
  responses: {
    204: { description: "User blocked/deleted (no content)" },
    401: { description: "Unauthorized" }
  }
});
const baseDoc = new import_zod_to_openapi.OpenApiGeneratorV3(registry.definitions).generateDocument({
  openapi: "3.0.0",
  info: {
    title: "User Service API",
    version: "1.0.0"
  },
  servers: [{ url: "http://localhost:3000" }]
});
baseDoc.components = {
  securitySchemes: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT"
    }
  }
};
const userOpenApiDoc = baseDoc;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  registry,
  userOpenApiDoc
});
//# sourceMappingURL=user.docs.js.map
