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

function getSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is missing from environment variables.");
  }

  return secret;
}

function getLegacySalt() {
  return process.env.PASSWORD_SALT || "edunova-password-salt";
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

    const a = Buffer.from(signature);
    const b = Buffer.from(expectedSignature);

    if (a.length !== b.length) return null;

    if (!timingSafeEqual(a, b)) return null;

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
 * Production password hashing.
 *
 * Format:
 * $scrypt$<salt>$<hash>
 *
 * A new random salt is generated for every password.
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
 * Verifies both:
 *
 * 1. New production $scrypt$ passwords
 * 2. Old MVP passwords created with the legacy fixed salt
 *
 * This allows existing users to continue working while we upgrade
 * their passwords.
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

      const derivedKey = scryptSync(
        password,
        salt,
        64
      ).toString("hex");

      const a = Buffer.from(derivedKey, "hex");
      const b = Buffer.from(storedHash, "hex");

      if (a.length !== b.length) {
        return false;
      }

      return timingSafeEqual(a, b);
    }

    // Legacy MVP password compatibility.
    const legacyHash = scryptSync(
      password,
      getLegacySalt(),
      64
    ).toString("hex");

    const a = Buffer.from(legacyHash, "hex");
    const b = Buffer.from(passwordHash, "hex");

    if (a.length !== b.length) {
      return false;
    }

    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export { SESSION_COOKIE };