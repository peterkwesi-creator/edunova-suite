const { PrismaClient } = require("@prisma/client");
const { scryptSync } = require("crypto");
const fs = require("fs");

function loadEnv() {
  const envPath = ".env";

  if (!fs.existsSync(envPath)) {
    throw new Error(".env file not found.");
  }

  const content = fs.readFileSync(envPath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) continue;

    const index = trimmed.indexOf("=");

    if (index === -1) continue;

    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnv();

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = process.env.PASSWORD_SALT;

  if (!salt) {
    throw new Error("PASSWORD_SALT is missing from .env");
  }

  return scryptSync(password, salt, 64).toString("hex");
}

async function main() {
  console.log("Resetting EduNova demo passwords...\n");

  const accounts = [
    {
      email: "admin@edunova.com",
      password: "admin123",
      role: "ADMIN",
    },
    {
      email: "teacher@edunova.com",
      password: "teacher123",
      role: "TEACHER",
    },
    {
      email: "student@edunova.com",
      password: "student123",
      role: "STUDENT",
    },
    {
      email: "parent@edunova.com",
      password: "parent123",
      role: "PARENT",
    },
  ];

  for (const account of accounts) {
    const user = await prisma.user.findUnique({
      where: {
        email: account.email,
      },
    });

    if (!user) {
      console.log(`❌ ${account.email} was not found`);
      continue;
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        passwordHash: hashPassword(account.password),
        active: true,
        role: account.role,
      },
    });

    console.log(`✅ ${account.email} password reset`);
  }

  console.log("\n🎉 Demo passwords have been reset.");
}

main()
  .catch((error) => {
    console.error("\n❌ Reset failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });