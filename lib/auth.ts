
import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "crypto";

export type SessionUser = {
  userId: string;
  email: string;
  role:
    | "SUPER_ADMIN"
    | "ADMIN"
    | "TEACHER"
    | "STUDENT"
    | "PARENT"
    | "ACCOUNTANT"
    | "SECRETARY";
  schoolId: string;
  exp?: number;
};

export const SESSION_COOKIE = "edunova_session";

const SESSION_DURATION_SECONDS = 60 * 60 * 24;

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not configured.");
  }

  return secret;
}

function sign(value: string): string {
  return createHmac("sha256", getSecret())
    .update(value)
    .digest("base64url");
}

export function hashPassword(password: string): string {
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters long.");
  }

  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");

  return `$scrypt$${salt}$${hash}`;
}

export function verifyPassword(
  password: string,
  storedHash: string,
): boolean {
  try {
    if (storedHash.startsWith("$scrypt$")) {
      const parts = storedHash.split("$");

      if (parts.length !== 4 || !parts[2] || !parts[3]) {
        return false;
      }

      const salt = parts[2];
      const expectedHash = Buffer.from(parts[3], "hex");
      const actualHash = scryptSync(password, salt, 64);

      return (
        expectedHash.length === actualHash.length &&
        timingSafeEqual(expectedHash, actualHash)
      );
    }

    // Support passwords created using EduNova's original fixed salt.
    const legacySalt =
      process.env.PASSWORD_SALT || "edunova-password-salt";

    const expectedHash = Buffer.from(storedHash, "hex");
    const actualHash = scryptSync(password, legacySalt, 64);

    return (
      expectedHash.length === actualHash.length &&
      timingSafeEqual(expectedHash, actualHash)
    );
  } catch {
    return false;
  }
}

export function createSession(
  user: Omit<SessionUser, "exp">,
): string {
  const payload: SessionUser = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
  };

  const encodedPayload = Buffer.from(
    JSON.stringify(payload),
  ).toString("base64url");

  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifySession(
  token: string | undefined | null,
): SessionUser | null {
  if (!token) {
    return null;
  }

  try {
    const parts = token.split(".");

    if (parts.length !== 2) {
      return null;
    }

    const [encodedPayload, suppliedSignature] = parts;

    if (!encodedPayload || !suppliedSignature) {
      return null;
    }

    const expectedSignature = sign(encodedPayload);
    const expectedBuffer = Buffer.from(expectedSignature);
    const suppliedBuffer = Buffer.from(suppliedSignature);

    if (
      expectedBuffer.length !== suppliedBuffer.length ||
      !timingSafeEqual(expectedBuffer, suppliedBuffer)
    ) {
      return null;
    }

    const decoded = Buffer.from(
      encodedPayload,
      "base64url",
    ).toString("utf8");

    const user = JSON.parse(decoded) as SessionUser;

    const allowedRoles = [
      "SUPER_ADMIN",
      "ADMIN",
      "TEACHER",
      "STUDENT",
      "PARENT",
      "ACCOUNTANT",
      "SECRETARY",
    ];

    if (
      !user ||
      typeof user.userId !== "string" ||
      typeof user.email !== "string" ||
      typeof user.schoolId !== "string" ||
      !allowedRoles.includes(user.role) ||
      typeof user.exp !== "number" ||
      user.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}