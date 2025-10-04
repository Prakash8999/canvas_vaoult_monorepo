// Enhanced logging utility for authentication events
export interface AuthLogData {
	userId?: string;
	email?: string;
	ip?: string;
	userAgent?: string;
	url?: string;
	method?: string;
	timestamp?: Date;
	error?: string;
	action: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'TOKEN_EXPIRED' | 'TOKEN_INVALID' | 'USER_NOT_FOUND' | 'AUTH_ERROR';
}

class AuthLogger {
	private static instance: AuthLogger;
	private logs: AuthLogData[] = [];
	private maxLogs = 1000; // Keep last 1000 logs in memory

	private constructor() {}

	public static getInstance(): AuthLogger {
		if (!AuthLogger.instance) {
			AuthLogger.instance = new AuthLogger();
		}
		return AuthLogger.instance;
	}

	public log(data: AuthLogData): void {
		const logEntry: AuthLogData = {
			...data,
			timestamp: new Date(),
		};

		// Add to in-memory logs
		this.logs.unshift(logEntry);
		if (this.logs.length > this.maxLogs) {
			this.logs.pop();
		}

		// Console log based on action type
		const logLevel = this.getLogLevel(data.action);
		const message = this.formatLogMessage(logEntry);

		switch (logLevel) {
			case 'error':
				console.error(message);
				break;
			case 'warn':
				console.warn(message);
				break;
			case 'info':
				console.info(message);
				break;
			default:
				console.log(message);
		}

		// TODO: In production, also send critical events to external logging service
		if (this.isCritical(data.action)) {
		    // this.sendToExternalLogger(logEntry);
		    console.error(`[CRITICAL AUTH EVENT] ${message}`);
		}
	}

	private getLogLevel(action: AuthLogData['action']): 'error' | 'warn' | 'info' | 'debug' {
		switch (action) {
			case 'LOGIN_FAILED':
			case 'TOKEN_INVALID':
			case 'AUTH_ERROR':
				return 'error';
			case 'TOKEN_EXPIRED':
			case 'USER_NOT_FOUND':
				return 'warn';
			case 'LOGIN_SUCCESS':
				return 'info';
			default:
				return 'debug';
		}
	}

	private formatLogMessage(data: AuthLogData): string {
		const { action, userId, email, ip, url, method, error } = data;
		let message = `[AUTH] ${action}`;
		
		if (userId) message += ` - User: ${userId}`;
		if (email) message += ` - Email: ${email}`;
		if (ip) message += ` - IP: ${ip}`;
		if (url && method) message += ` - ${method} ${url}`;
		if (error) message += ` - Error: ${error}`;

		return message;
	}

	private isCritical(action: AuthLogData['action']): boolean {
		return ['AUTH_ERROR', 'LOGIN_FAILED'].includes(action);
	}

	// Get recent auth logs (useful for debugging)
	public getRecentLogs(count: number = 100): AuthLogData[] {
		return this.logs.slice(0, count);
	}

	// Get logs for specific user
	public getUserLogs(userId: string, count: number = 50): AuthLogData[] {
		return this.logs
			.filter(log => log.userId === userId)
			.slice(0, count);
	}

	// Get failed login attempts from specific IP
	public getFailedAttemptsFromIP(ip: string, timeWindow: number = 15 * 60 * 1000): AuthLogData[] {
		const cutoff = new Date(Date.now() - timeWindow);
		return this.logs.filter(log => 
			log.ip === ip && 
			log.action === 'LOGIN_FAILED' && 
			log.timestamp && 
			log.timestamp > cutoff
		);
	}
}

export const authLogger = AuthLogger.getInstance();