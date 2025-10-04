import { OpenApiGeneratorV3, OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import {
	UserCreateZodSchema,
	UserZodSchema,
	UserOtpVerifySchema,
	UserProfileUpdateSchema,
} from "./users.model";
import { z } from 'zod';


export const registry = new OpenAPIRegistry();
// Core models
registry.register('User', UserZodSchema);
registry.register('UserCreate', UserCreateZodSchema);
registry.register('UserProfileUpdate', UserProfileUpdateSchema);
registry.register('UserOtpVerify', UserOtpVerifySchema);

// Login schema (email + password)
const UserLoginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(1),
});
registry.register('UserLogin', UserLoginSchema);

// Response token schema (used by login/verify endpoints)
const TokenResponseSchema = z.object({ token: z.string() });
registry.register('TokenResponse', TokenResponseSchema);

// Create (signup)
registry.registerPath({
	method: 'post',
	path: '/api/v1/user/signup',
	tags: ['User'],
	summary: 'Create a new user (signup)',
	request: {
		body: {
			content: {
				'application/json': { schema: UserCreateZodSchema },
			},
		},
	},
	responses: {
		201: {
			description: 'User created successfully',
			content: {
				'application/json': { schema: UserZodSchema },
			},
		},
		400: { description: 'Invalid request' },
	},
});

// Verify OTP
registry.registerPath({
	method: 'post',
	path: '/api/v1/user/verify-otp',
	tags: ['User'],
	summary: 'Verify OTP and return auth token',
	request: {
		body: {
			content: {
				'application/json': { schema: UserOtpVerifySchema },
			},
		},
	},
	responses: {
		200: {
			description: 'OTP verified, returns token',
			content: {
				'application/json': { schema: TokenResponseSchema },
			},
		},
		400: { description: 'Invalid OTP or request' },
	},
});

// Login
registry.registerPath({
	method: 'post',
	path: '/api/v1/user/login',
	tags: ['User'],
	summary: 'User login (email + password)',
	request: {
		body: {
			content: {
				'application/json': { schema: UserLoginSchema },
			},
		},
	},
	responses: {
		200: {
			description: 'Login successful, returns token',
			content: {
				'application/json': { schema: TokenResponseSchema },
			},
		},
		401: { description: 'Invalid credentials' },
	},
});

// Get current user profile (protected)
registry.registerPath({
	method: 'get',
	path: '/api/v1/user',
	tags: ['User'],
	summary: "Get current user's profile",
	// mark this operation as protected by the bearerAuth scheme
	security: [{ bearerAuth: [] }],
	responses: {
		200: {
			description: 'User profile',
			content: {
				'application/json': { schema: UserZodSchema },
			},
		},
		401: { description: 'Unauthorized' },
	},
});

// Update profile
registry.registerPath({
	method: 'patch',
	path: '/api/v1/user',
	tags: ['User'],
	summary: "Update current user's profile",
	security: [{ bearerAuth: [] }],
	request: {
		body: {
			content: {
				'application/json': { schema: UserProfileUpdateSchema },
			},
		},
	},
	responses: {
		200: {
			description: 'Updated user profile',
			content: {
				'application/json': { schema: UserZodSchema },
			},
		},
		400: { description: 'Invalid request' },
		401: { description: 'Unauthorized' },
	},
});

// Delete / Block user
registry.registerPath({
	method: 'delete',
	path: '/api/v1/user',
	tags: ['User'],
	summary: 'Block or delete current user',
	security: [{ bearerAuth: [] }],
	responses: {
		204: { description: 'User blocked/deleted (no content)' },
		401: { description: 'Unauthorized' },
	},
});

const baseDoc = new OpenApiGeneratorV3(registry.definitions).generateDocument({
	openapi: '3.0.0',
	info: {
		title: 'User Service API',
		version: '1.0.0',
	},
	servers: [{ url: 'http://localhost:3000' }],
});

// Attach security schemes after generation to avoid type incompatibilities with
// the generator's config object. Swagger UI will then show an Authorize button.
(baseDoc as any).components = {
	securitySchemes: {
		bearerAuth: {
			type: 'http',
			scheme: 'bearer',
			bearerFormat: 'JWT',
		},
	},
};

export const userOpenApiDoc = baseDoc;
