import crypto from "node:crypto";

export const generateCode = () => String(Math.floor(100000 + Math.random() * 900000));

export const hashCode = ({ code, userId, salt }) => {
  return crypto.createHash("sha256").update(`${userId}:${code}:${salt}`).digest("hex");
};

