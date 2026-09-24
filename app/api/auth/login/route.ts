import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  verifyPassword,
  SESSION_COOKIE,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    if (!email || !password) {
      return NextResponse.json(
        {
          error:
            "Email and password are required.",
        },
        { status: 400 }
      );
    }

    const user =
      await prisma.user.findUnique({
        where: {
          email,
        },
      });

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    if (!user.active) {
      return NextResponse.json(
        {
          error:
            "This account is inactive.",
        },
        { status: 403 }
      );
    }

    const passwordCorrect =
      verifyPassword(
        password,
        user.passwordHash
      );

    if (!passwordCorrect) {
      return NextResponse.json(
        {
          error:
            "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    const session =
      createSession({
        userId: user.id,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
      });

    const cookieStore =
      await cookies();

    cookieStore.set({
      name: SESSION_COOKIE,
      value: session,
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return NextResponse.json({
      success: true,
      role: user.role,
      user: {
        id: user.id,
        email: user.email,
        firstName:
          user.firstName,
        lastName:
          user.lastName,
      },
    });
  } catch (error) {
    console.error(
      "LOGIN API ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "An unexpected server error occurred.",
      },
      { status: 500 }
    );
  }
}