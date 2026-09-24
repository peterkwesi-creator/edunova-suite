import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  verifySession,
} from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get(SESSION_COOKIE)?.value;

    const session = verifySession(token);

    if (
      !session ||
      (session.role !== "ADMIN" &&
        session.role !== "SUPER_ADMIN")
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const adminUser =
      await prisma.user.findFirst({
        where: {
          id: session.userId,
          schoolId: session.schoolId,
          active: true,
          role: {
            in: ["ADMIN", "SUPER_ADMIN"],
          },
        },
        select: {
          id: true,
          schoolId: true,
        },
      });

    if (!adminUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const [
      teachers,
      students,
      parents,
    ] = await Promise.all([
      prisma.teacher.findMany({
        where: {
          schoolId: session.schoolId,
        },
        select: {
          id: true,
          employeeNumber: true,
          firstName: true,
          lastName: true,
          email: true,
          position: true,
          user: {
            select: {
              id: true,
            },
          },
        },
        orderBy: {
          firstName: "asc",
        },
      }),

      prisma.student.findMany({
        where: {
          schoolId: session.schoolId,
        },
        select: {
          id: true,
          studentNumber: true,
          firstName: true,
          lastName: true,
          email: true,
          class: {
            select: {
              name: true,
            },
          },
          user: {
            select: {
              id: true,
            },
          },
        },
        orderBy: {
          firstName: "asc",
        },
      }),

      prisma.parent.findMany({
        where: {
          schoolId: session.schoolId,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          user: {
            select: {
              id: true,
            },
          },
        },
        orderBy: {
          firstName: "asc",
        },
      }),
    ]);

    return NextResponse.json({
      teachers,
      students,
      parents,
    });
  } catch (error) {
    console.error(
      "GET /api/admin/users/profiles error:",
      error
    );

    return NextResponse.json(
      { error: "Failed to load profiles" },
      { status: 500 }
    );
  }
}