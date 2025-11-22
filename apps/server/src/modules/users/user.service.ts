import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { User, UserCreationAttributes } from './users.model';
import redisClient from '../../config/redis';
import { otpQueue } from '../../jobs/producer';
import { createRefreshToken, generateAccessToken, setRefreshTokenCookie } from '../../common/utils/authTokenService';
import { Request, Response } from 'express';


export async function createUserService(body: UserCreationAttributes) {
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

export async function verifyOtpService(email: string, otp: string, req: Request, res: Response) {
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
  const accessToken = generateAccessToken({
    id: user.dataValues.id!,
    email: user.dataValues.email!,
  });
  const refreshToken = await createRefreshToken(user.dataValues.id!, req);
  setRefreshTokenCookie(res, refreshToken);
  return { token: accessToken };
}

export async function loginUserService(email: string, otpOrPassword: string, req: Request, res: Response) {
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

  // 1) access token
  const accessToken = generateAccessToken({
    id: user.dataValues.id!,
    email: user.dataValues.email!,
  });

  // 2) refresh token + cookie
  const refreshToken = await createRefreshToken(user.dataValues.id!, req);
  setRefreshTokenCookie(res, refreshToken);
  return { token: accessToken }

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
  await User.update({ block: true, blocked_on: new Date() }, { where: { id: userId } });
  return {};
}

export async function forgotPasswordOtpService(email: string) {
  const user = await User.findOne({ where: { email, block: false } });
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

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await redisClient.set(`user:password-reset-otp:${user.dataValues.id}`, otp, { EX: 300 }); // 5 minutes

  await otpQueue.add('send-password-reset-otp', { email: user.dataValues.email, otp: parseInt(otp) });

  return { message: 'Password reset OTP sent to your email' };
}

export async function forgotPasswordLinkService(email: string) {
  const user = await User.findOne({ where: { email, block: false } });
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

  const resetToken = crypto.randomBytes(32).toString('hex');
  await redisClient.set(`user:password-reset-token:${resetToken}`, user.dataValues.id!.toString(), { EX: 900 }); // 15 minutes

  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

  await otpQueue.add('send-password-reset-link', { email: user.dataValues.email, resetLink });

  return { message: 'Password reset link sent to your email' };
}

export async function resetPasswordWithOtpService(email: string, otp: string, newPassword: string) {
  const user = await User.findOne({ where: { email, block: false } });
  if (!user) {
    const err: any = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const storedOtp = await redisClient.get(`user:password-reset-otp:${user.dataValues.id}`);
  if (!storedOtp) {
    const err: any = new Error('OTP expired or not found. Please request a new one.');
    err.statusCode = 400;
    throw err;
  }

  if (storedOtp !== otp) {
    const err: any = new Error('Invalid OTP');
    err.statusCode = 400;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await User.update({ password: hashedPassword }, { where: { email } });
  await redisClient.del(`user:password-reset-otp:${user.dataValues.id}`);

  return { message: 'Password reset successfully' };
}

export async function resetPasswordWithTokenService(token: string, newPassword: string) {
  const userId = await redisClient.get(`user:password-reset-token:${token}`);
  if (!userId) {
    const err: any = new Error('Invalid or expired reset token');
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findOne({ where: { id: parseInt(userId), block: false } });
  if (!user) {
    const err: any = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await User.update({ password: hashedPassword }, { where: { id: parseInt(userId) } });
  await redisClient.del(`user:password-reset-token:${token}`);

  return { message: 'Password reset successfully' };
}

export async function logoutUserService(userId: number) {


}