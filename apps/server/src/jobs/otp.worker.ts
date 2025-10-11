// worker/otp.worker.ts
import { Worker } from 'bullmq';
import { sendMail } from '../common/libs/emails/email';
import { authOtpEmailTemp, passwordResetOtpEmailTemp, passwordResetLinkEmailTemp } from '../common/libs/emails/template';


export const otpWorker = new Worker('send-otp', async (job) => {
	
  const { email, otp } = job.data;

  try {
    console.log(`Sending OTP ${otp} to email ${email}`);
    const result = await sendMail(email, `Your CanvasVault OTP`, authOtpEmailTemp(otp, true));
    console.log(result)
	return true;
  } catch (err) {
    // throw to trigger BullMQ retry/backoff
    throw err;
  }
}, { 
  // Use `url` when REDIS_HOST is a full redis URL (e.g. redis://localhost:6379).
  // Passing the full URL into `host` causes DNS lookups for the literal string.
  connection: { url: process.env.REDIS_HOST } 
});

export const passwordResetOtpWorker = new Worker('send-password-reset-otp', async (job) => {
  const { email, otp } = job.data;

  try {
    console.log(`Sending password reset OTP ${otp} to email ${email}`);
    const result = await sendMail(email, `Reset Your CanvasVault Password`, passwordResetOtpEmailTemp(otp));
    console.log(result);
    return true;
  } catch (err) {
    // throw to trigger BullMQ retry/backoff
    throw err;
  }
}, {
  connection: { url: process.env.REDIS_HOST }
});

export const passwordResetLinkWorker = new Worker('send-password-reset-link', async (job) => {
  const { email, resetLink } = job.data;

  try {
    console.log(`Sending password reset link to email ${email}`);
    const result = await sendMail(email, `Reset Your CanvasVault Password`, passwordResetLinkEmailTemp(resetLink));
    console.log(result);
    return true;
  } catch (err) {
    // throw to trigger BullMQ retry/backoff
    throw err;
  }
}, {
  connection: { url: process.env.REDIS_HOST }
});

otpWorker.on('failed', (job, err) => {
  // log or push to dead-letter queue if attempts exhausted
});

passwordResetOtpWorker.on('failed', (job, err) => {
  // log or push to dead-letter queue if attempts exhausted
});

passwordResetLinkWorker.on('failed', (job, err) => {
  // log or push to dead-letter queue if attempts exhausted
});
