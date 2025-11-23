import crypto from "crypto";

export const redisKey = (...parts: (string | number)[]): string => {
    const rawKey = parts.join(":");
    return crypto.createHash("sha256").update(rawKey).digest("hex");
};