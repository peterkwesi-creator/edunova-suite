import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  verifySession,
} from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore =
      await cookies();

    const token =
      cookieStore.get(
        SESSION_COOKIE
      )?.value;

    const session =
      verifySession(token);

    if (
      !session ||
      session.role !== "STUDENT"
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user =
      await prisma.user.findFirst({
        where: {
          id: session.userId,
          schoolId:
            session.schoolId,
          role: "STUDENT",
          active: true,
        },
        select: {
          id: true,
          studentId: true,
          schoolId: true,
        },
      });

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Student account could not be found.",
        },
        { status: 404 }
      );
    }

    if (!user.studentId) {
      return NextResponse.json(
        {
          error:
            "Your account is not linked to a student profile.",
        },
        { status: 404 }
      );
    }

    const student =
      await prisma.student.findFirst({
        where: {
          id: user.studentId,
          schoolId:
            user.schoolId,
        },
        select: {
          id: true,
        },
      });

    if (!student) {
      return NextResponse.json(
        {
          error:
            "Student profile not found.",
        },
        { status: 404 }
      );
    }

    const notes =
      await prisma.studentNote.findMany({
        where: {
          schoolId:
            user.schoolId,
          studentId:
            student.id,
        },
        include: {
          author: {
            select: {
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json(
      notes
    );
  } catch (error) {
    console.error(
      "GET /api/student/notes error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load notes.",
      },
      { status: 500 }
    );
  }
}