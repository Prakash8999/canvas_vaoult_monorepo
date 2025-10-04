import { Request, Response, NextFunction } from "express";
import { errorHandler } from "../middlewares/responseHandler";

interface RateLimitData {
	count: number;
	resetTime: number;
}

class RateLimiter {
	private static instance: RateLimiter;
	private requests = new Map<string, RateLimitData>();
	private cleanupInterval: NodeJS.Timeout;

	private constructor() {
		// Clean up expired entries every 5 minutes
		this.cleanupInterval = setInterval(() => {
			const now = Date.now();
			for (const [key, data] of this.requests.entries()) {
				if (now > data.resetTime) {
					this.requests.delete(key);
				}
			}
		}, 5 * 60 * 1000);
	}

	public static getInstance(): RateLimiter {
		if (!RateLimiter.instance) {
			RateLimiter.instance = new RateLimiter();
		}
		return RateLimiter.instance;
	}

	public isAllowed(key: string, limit: number, windowMs: number): boolean {
		const now = Date.now();
		const data = this.requests.get(key);

		if (!data || now > data.resetTime) {
			// First request or window expired, reset
			this.requests.set(key, {
				count: 1,
				resetTime: now + windowMs
			});
			return true;
		}

		if (data.count >= limit) {
			return false;
		}

		// Increment count
		data.count++;
		return true;
	}

	public getRemainingRequests(key: string, limit: number): number {
		const data = this.requests.get(key);
		if (!data || Date.now() > data.resetTime) {
			return limit;
		}
		return Math.max(0, limit - data.count);
	}

	public getResetTime(key: string): number | null {
		const data = this.requests.get(key);
		if (!data || Date.now() > data.resetTime) {
			return null;
		}
		return data.resetTime;
	}

	public decrementCount(key: string): void {
		const data = this.requests.get(key);
		if (data && data.count > 0) {
			data.count--;
		}
	}

	public destroy(): void {
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
		}
	}
}

const rateLimiter = RateLimiter.getInstance();

interface RateLimitOptions {
	windowMs?: number; // Time window in milliseconds (default: 15 minutes)
	max?: number; // Maximum requests per window (default: 100)
	keyGenerator?: (req: Request) => string; // Function to generate rate limit key
	skipSuccessfulRequests?: boolean; // Don't count successful requests
	skipFailedRequests?: boolean; // Don't count failed requests
	message?: string; // Error message when rate limit is exceeded
}

export const createRateLimit = (options: RateLimitOptions = {}) => {
	const {
		windowMs = 15 * 60 * 1000, // 15 minutes
		max = 100,
		keyGenerator = (req: Request) => req.ip || 'unknown',
		skipSuccessfulRequests = false,
		skipFailedRequests = false,
		message = 'Too many requests, please try again later.'
	} = options;

	return (req: Request, res: Response, next: NextFunction): void => {
		const key = keyGenerator(req);
		
		if (!rateLimiter.isAllowed(key, max, windowMs)) {
			const resetTime = rateLimiter.getResetTime(key);
			const retryAfter = resetTime ? Math.ceil((resetTime - Date.now()) / 1000) : 0;
			
			res.set({
				'X-RateLimit-Limit': max.toString(),
				'X-RateLimit-Remaining': '0',
				'X-RateLimit-Reset': resetTime ? Math.ceil(resetTime / 1000).toString() : '',
				'Retry-After': retryAfter.toString()
			});

			errorHandler(res, message, {}, 429);
			return;
		}

		// Set rate limit headers
		const remaining = rateLimiter.getRemainingRequests(key, max);
		const resetTime = rateLimiter.getResetTime(key);
		
		res.set({
			'X-RateLimit-Limit': max.toString(),
			'X-RateLimit-Remaining': remaining.toString(),
			'X-RateLimit-Reset': resetTime ? Math.ceil(resetTime / 1000).toString() : ''
		});

		// If we need to skip counting on response, we'll handle it in response
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
				
				// If we shouldn't count this request, we need to decrement
				if (!shouldCount) {
					rateLimiter.decrementCount(key);
				}
				
				return originalSend.call(this, data);
			};
		}

		next();
	};
};

// Predefined rate limiters for common use cases
export const authRateLimit = createRateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 10, // 10 login attempts per 15 minutes
	keyGenerator: (req: Request) => `auth:${req.ip}`,
	message: 'Too many authentication attempts, please try again later.'
});

export const generalRateLimit = createRateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 1000, // 1000 requests per 15 minutes
	message: 'Too many requests, please try again later.'
});

export const strictRateLimit = createRateLimit({
	windowMs: 1 * 60 * 1000, // 1 minute
	max: 5, // 5 requests per minute
	message: 'Rate limit exceeded. Please wait before making more requests.'
});