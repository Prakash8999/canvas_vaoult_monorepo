import { Queue } from 'bullmq';


// If REDIS_HOST contains a full redis URL (e.g. redis://localhost:6379)
// BullMQ expects the connection `url` for that form. Passing the full URL
// into `host` causes DNS lookups for the literal string 'redis://...'.
export const otpQueue = new Queue('send-otp', { connection: { url: process.env.REDIS_HOST }, defaultJobOptions:{
	removeOnComplete:true,
	 removeOnFail: { age: 3600 }
} });
