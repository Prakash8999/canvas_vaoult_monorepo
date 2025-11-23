// utils/authTokens.ts
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import AuthToken from "../../modules/shared/model/auth/authToken.model";
import { Op } from "sequelize";

const ACCESS_TOKEN_TTL = "1d";        // access token lifetime
const REFRESH_TOKEN_DAYS = 30;         // refresh token lifetime (days)

const validateJwtSecret = (): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET not set");
    }
    return secret;
};

export const generateAccessToken = (user: { id: number; email: string, deviceId: string, jti: string }) => {
    const secret = validateJwtSecret();

    return jwt.sign(
        { userId: user.id, email: user.email, deviceId: user.deviceId, jti: user.jti},
        secret,
        {
            expiresIn: ACCESS_TOKEN_TTL,
            issuer: "canvas-backend",
            audience: "canvas-users",
        }
    );
};

export const hashToken = (token: string) =>
    crypto.createHash("sha256").update(token).digest("hex");

export const createRefreshToken = async (
    userId: number,
    req: Request
): Promise<string> => {
    const rawToken = crypto.randomBytes(64).toString("hex"); // what we give to client
    const tokenHash = hashToken(rawToken);

    const expires = new Date();
    expires.setDate(expires.getDate() + REFRESH_TOKEN_DAYS);

    const xForwardedFor = req.headers["x-forwarded-for"];
    const ip =
        req.ip ||
        (typeof xForwardedFor === "string"
            ? xForwardedFor.split(",")[0].trim()
            : undefined) ||
        "unknown";

    const userAgent = req.get("User-Agent") || "unknown";

    await AuthToken.create({
        user_id: userId,
        token_hash: tokenHash,
        ip_address: ip,
        user_agent: userAgent,
        revoked: false,
        replaced_by_token_id: null,
        expires_at: expires,
    });

    return rawToken;
};

export const setRefreshTokenCookie = (res: Response, token: string) => {
    const isProduction = process.env.NODE_ENV === "production";

    // In development with different ports (e.g., frontend:8080, backend:3000),
    // we need sameSite: 'none' and secure: true for cross-origin cookies to work
    const cookieOptions = {
        httpOnly: true,
        secure: isProduction ? true : false, // Required for sameSite: 'none', also works in dev with https or localhost
        sameSite: isProduction ? "strict" as const : "lax" as const, // 'none' allows cross-origin in dev
        path: "/",
        maxAge: 1000 * 60 * 60 * 24 * REFRESH_TOKEN_DAYS,
    };

    res.cookie("refresh_token", token, cookieOptions);

    console.log('🍪 Cookie set with options:', cookieOptions);
    console.log('🍪 Response headers after cookie set:', res.getHeaders());
};

export const clearRefreshTokenCookie = (res: Response) => {
    const isProduction = process.env.NODE_ENV === "production";

    res.clearCookie("refresh_token", {
        httpOnly: true,
        secure: true,
        sameSite: isProduction ? "strict" : "none",
        path: "/",
    });
};
export const findValidRefreshSession = async (
    rawToken: string,
    userId?: number
) => {
    const tokenHash = hashToken(rawToken);
    const now = new Date();

    const whereOptions: any = {
        token_hash: tokenHash,
        revoked: false,
        expires_at: { [Op.gt]: now },
    };

    if (userId) whereOptions.user_id = userId;

    const session = await AuthToken.findOne({ where: whereOptions });

    console.log("session =>", session);

    return session;
};

export const revokeRefreshSession = async (session: AuthToken) => {
    await session.update({ revoked: true });
};


export const rotateRefreshToken = async (
    session: AuthToken,
    req: Request
): Promise<string> => {
    // revoke old one
    session.revoked = true;

    const rawToken = await createRefreshToken(session.user_id, req);

    // get new session to store relation (optional)
    const tokenHash = hashToken(rawToken);
    const newSession = await AuthToken.findOne({
        where: { token_hash: tokenHash, user_id: session.user_id },
    });

    if (newSession) {
        session.replaced_by_token_id = newSession.id;
    }

    await session.save();

    return rawToken;
};
