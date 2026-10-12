
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const session = verifySession(
    cookieStore.get(SESSION_COOKIE)?.value
  );

  if (!session) return null;

  const user = await prisma.user.findFirst({
    where: {
      id: session.userId,
      schoolId: session.schoolId,
      role: session.role,
      active: true,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      schoolId: true,
    },
  });

  return user;
}

export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("GET /api/auth/profile:", error);

    return NextResponse.json(
      { error: "Unable to load profile." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required." },
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
        { error: "Invalid profile information." },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;

    const firstName =
      typeof data.firstName === "string"
        ? data.firstName.trim()
        : user.firstName;

    const lastName =
      typeof data.lastName === "string"
        ? data.lastName.trim()
        : user.lastName;

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "First name and last name are required." },
        { status: 400 }
      );
    }

    if (firstName.length > 100 || lastName.length > 100) {
      return NextResponse.json(
        { error: "Names must not exceed 100 characters." },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName,
        lastName,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        schoolId: true,
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("PATCH /api/auth/profile:", error);

    return NextResponse.json(
      { error: "Unable to update profile." },
      { status: 500 }
    );
  }
}
