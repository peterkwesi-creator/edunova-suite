
import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "crypto";

export type SessionUser = {
  userId: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";
  schoolId: string;
  exp: number;
};

const SESSION_COOKIE = "edunova_session";
const LEGACY_FIXED_SALT = "edunova-password-salt";

function getSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is missing from environment variables.");
  }

  return secret;
}

function getLegacySalt() {
  return process.env.PASSWORD_SALT || LEGACY_FIXED_SALT;
}

function sign(payload: string) {
  return createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");
}

export function createSession(user: Omit<SessionUser, "exp">) {
  const payload: SessionUser = {
    ...user,
    exp: Date.now() + 24 * 60 * 60 * 1000,
  };

  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(encoded);

  return `${encoded}.${signature}`;
}

export function verifySession(
  token: string | undefined
): SessionUser | null {
  if (!token) return null;

  try {
    const [encoded, signature] = token.split(".");

    if (!encoded || !signature) return null;

    const expectedSignature = sign(encoded);
    const actual = Buffer.from(signature);
    const expected = Buffer.from(expectedSignature);

    if (actual.length !== expected.length) return null;
    if (!timingSafeEqual(actual, expected)) return null;

    const session = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as SessionUser;

    if (!session.exp || session.exp < Date.now()) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Creates a modern scrypt password hash with a unique random salt.
 */
export function hashPassword(password: string) {
  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64).toString("hex");

  return `$scrypt$${salt}$${derivedKey}`;
}

/**
 * Verifies modern salted scrypt hashes and legacy hashes.
 * Legacy verification supports both the configured salt and the original
 * fixed salt used by the earlier MVP implementation.
 */
export function verifyPassword(
  password: string,
  passwordHash: string
) {
  try {
    if (passwordHash.startsWith("$scrypt$")) {
      const parts = passwordHash.split("$");

      if (parts.length !== 4) {
        return false;
      }

      const salt = parts[2];
      const storedHash = parts[3];

      if (!/^[0-9a-f]+$/i.test(storedHash) || storedHash.length % 2 !== 0) {
        return false;
      }

      const actual = scryptSync(password, salt, 64);
      const expected = Buffer.from(storedHash, "hex");

      if (actual.length !== expected.length) {
        return false;
      }

      return timingSafeEqual(actual, expected);
    }

    if (!/^[0-9a-f]+$/i.test(passwordHash) || passwordHash.length % 2 !== 0) {
      return false;
    }

    const expected = Buffer.from(passwordHash, "hex");
    const legacySalts = new Set([
      getLegacySalt(),
      LEGACY_FIXED_SALT,
    ]);

    for (const salt of legacySalts) {
      const actual = scryptSync(password, salt, 64);

      if (
        actual.length === expected.length &&
        timingSafeEqual(actual, expected)
      ) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

export { SESSION_COOKIE };
