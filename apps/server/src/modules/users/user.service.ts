import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User, UserCreateZodSchema } from './users.model';
import redisClient from '../../config/redis';
import { otpQueue } from '../../jobs/producer';

// Use the model's creation schema type to avoid duplication. Keep the minimal
// required fields compatible with existing controller callers.
export type CreateUserBody = Partial<z.infer<typeof UserCreateZodSchema>> & {
  name: string;
  email: string;
  password: string;
  profile_url?: string | null;
};

export async function createUserService(body: CreateUserBody) {
  if (!User || !User.sequelize) throw new Error('Database not initialized');

  const existing = await User.count({ where: { email: body.email } });
  console.log('Existing user count:', existing);
  if (existing > 0) {
    const err: any = new Error('User already exists');
    err.statusCode = 409;
    throw err;
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // callback transaction
  const user = await User.sequelize.transaction(async (t) => {
    const hashedPassword = await bcrypt.hash(body.password, 10);
    const addData = {
      ...body,
      password: hashedPassword,
      created_at: new Date(),
      updated_at: new Date(),
      is_email_verified: false,
      block: false,
    };

    try {
      const created = await User.create(addData, { transaction: t });
      await redisClient.set(`user:otp:${created.dataValues.id}`, otp, { EX: 300 });
      return created;
    } catch (err: any) {
      // Handle unique constraint races gracefully and bubble a 409.
      if (err.name === 'SequelizeUniqueConstraintError' || err?.errors?.[0]?.type === 'unique violation') {
        const e: any = new Error('User already exists');
        e.statusCode = 409;
        throw e;
      }
      throw err;
    }
  });

  await otpQueue.add(
    'send-otp',
    { email: user.email, otp: otp },
    // {
    // Use a jobId without ':' because BullMQ disallows ':' in custom ids
    // (it uses ':' for internal namespacing). This prevents the "Custom Id cannot contain :" error.
    // jobId: `otp-${user.id}`,
    // }
  );

  return { user, otp };
}

export async function verifyOtpService(email: string, otp: string) {
  const user = await User.findOne({ where: { email }, attributes: ['id', 'email', 'is_email_verified'] });
  if (!user) {
    const err: any = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const storedOtp = await redisClient.get(`user:otp:${user.dataValues.id}`);
  console.log("Stored OTP:", storedOtp, "Provided OTP:", otp);
  console.log("User ID:", user.dataValues.id, "Email:", user.dataValues.email);
  if (!storedOtp) {
    const err: any = new Error('OTP expired or not found. Please request a new one.');
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    await redisClient.set(`user:otp:${user.dataValues.id}`, newOtp, { EX: 300 });
    await otpQueue.add('send-otp', { email: user.dataValues.email, otp: newOtp });
    err.statusCode = 400;
    throw err;
  }
  if (storedOtp !== otp) {
    const err: any = new Error('Invalid OTP');
    err.statusCode = 400;
    throw err;
  }

  await User.update({ is_email_verified: true }, { where: { email } });
  await redisClient.del(`user:otp:${user.dataValues.id}`);

  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not defined in environment variables');
  // Sign token with the expected claims (issuer & audience) and a 'userId' field
  // so the auth middleware's jwt.verify calls succeed.
  const token = jwt.sign(
    { userId: user.dataValues.id, email: user.dataValues.email },
    process.env.JWT_SECRET,
    { expiresIn: '1h', issuer: 'canvas-backend', audience: 'canvas-users' }
  );
  return { token };
}

export async function loginUserService(email: string, otpOrPassword: string) {
  const user = await User.findOne({ where: { email, block: false }, attributes: ['id', 'email', 'password', 'is_email_verified'] });
  if (!user) {
    const err: any = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  if (!user.dataValues.is_email_verified) {
    const err: any = new Error('Email not verified');
    err.statusCode = 403;
    throw err;
  }

  const passwordMatch = await bcrypt.compare(otpOrPassword, user.dataValues.password);
  if (!passwordMatch) {
    const err: any = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not defined in environment variables');

  const token = jwt.sign(
    { userId: user.dataValues.id, email: user.dataValues.email },
    process.env.JWT_SECRET,
    { expiresIn: '1h', issuer: 'canvas-backend', audience: 'canvas-users' }
  );
  return { token };
}

export async function getUserProfileService(userId: number) {
  const user = await User.findOne({
    where: { id: userId, block: false },
    attributes: ['id', 'email', 'name', 'is_email_verified', 'profile_url', 'created_at', 'updated_at', 'bio', 'location', 'website', 'github', 'twitter'],
  });
  if (!user) {
    const err: any = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return user;
}

export async function updateUserProfileService(userId: number, body: Record<string, unknown>) {
  const user = await User.findOne({ where: { id: userId, block: false } });
  if (!user) {
    const err: any = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  await User.update(body, { where: { id: userId } });
  return {};
}

export async function blockUserService(userId: number) {
  const user = await User.findOne({ where: { id: userId, block: false } });
  if (!user) {
    const err: any = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  await User.update({ block: true, blocked_at: new Date() }, { where: { id: userId } });
  return {};
}
