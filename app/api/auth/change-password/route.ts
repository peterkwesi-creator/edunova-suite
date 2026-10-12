
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  verifySession,
  verifyPassword,
  hashPassword,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = verifySession(
      cookieStore.get(SESSION_COOKIE)?.value
    );

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        id: session.userId,
        schoolId: session.schoolId,
        role: session.role,
        active: true,
      },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Account not found or inactive." },
        { status: 401 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid password information." },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;

    const currentPassword =
      typeof data.currentPassword === "string"
        ? data.currentPassword
        : "";

    const newPassword =
      typeof data.newPassword === "string"
        ? data.newPassword
        : "";

    const confirmPassword =
      typeof data.confirmPassword === "string"
        ? data.confirmPassword
        : "";

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "Complete all password fields." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Your new password must contain at least 8 characters." },
        { status: 400 }
      );
    }

    if (newPassword.length > 256) {
      return NextResponse.json(
        { error: "Your new password is too long." },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "The new passwords do not match." },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: "Choose a password different from your current one." },
        { status: 400 }
      );
    }

    if (!verifyPassword(currentPassword, user.passwordHash)) {
      return NextResponse.json(
        { error: "Your current password is incorrect." },
        { status: 400 }
      );
    }

    const passwordHash = hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return NextResponse.json({
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("POST /api/auth/change-password:", error);

    return NextResponse.json(
      { error: "Unable to change password." },
      { status: 500 }
    );
  }
}
