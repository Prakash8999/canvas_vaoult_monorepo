// utils/authTokens.ts
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import AuthToken from "../../modules/shared/model/auth/authToken.model";

const ACCESS_TOKEN_TTL = "1d";        // access token lifetime
const REFRESH_TOKEN_DAYS = 30;         // refresh token lifetime (days)

const validateJwtSecret = (): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET not set");
    }
    return secret;
};

export const generateAccessToken = (user: { id: number; email: string }) => {
    const secret = validateJwtSecret();
    return jwt.sign(
        { userId: user.id, email: user.email },
        secret,
        {
            expiresIn: ACCESS_TOKEN_TTL,
            issuer: "canvas-backend",
            audience: "canvas-users",
        }
    );
};

const hashToken = (token: string) =>
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
    const secure = process.env.NODE_ENV === "production";

    res.cookie("refresh_token", token, {
        httpOnly: true,
        secure,
        sameSite: "lax",
        path: "/api/auth/refresh",
        maxAge: 1000 * 60 * 60 * 24 * REFRESH_TOKEN_DAYS,
    });
};

export const clearRefreshTokenCookie = (res: Response) => {
    res.clearCookie("refresh_token", {
        path: "/api/auth/refresh",
    });
};

export const findValidRefreshSession = async (
    rawToken: string,
    userId?: number
) => {
    const tokenHash = hashToken(rawToken);
    const now = new Date();

    const where: any = {
        token_hash: tokenHash,
        revoked: false,
        expires_at: { $gt: now } as any,
    };

    if (userId) where.user_id = userId;

    const session = await AuthToken.findOne({ where });
    return session;
};

export const revokeRefreshSession = async (session: AuthToken) => {
    session.revoked = true;
    await session.save();
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
