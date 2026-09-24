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
      session.role !== "TEACHER"
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.userId,
      },
      select: {
        id: true,
        schoolId: true,
        teacherId: true,
      },
    });

    if (!user || !user.schoolId) {
      return NextResponse.json(
        { error: "Teacher account not found." },
        { status: 404 }
      );
    }

    let teacherId = user.teacherId;

    if (!teacherId) {
      return NextResponse.json(
        {
          error:
            "Your account is not linked to a teacher profile.",
        },
        { status: 404 }
      );
    }

    const classSubjects =
      await prisma.classSubject.findMany({
        where: {
          teacherId,
          class: {
            schoolId: user.schoolId,
          },
        },
        select: {
          classId: true,
        },
        distinct: ["classId"],
      });

    const classIds = classSubjects.map(
      (item) => item.classId
    );

    if (classIds.length === 0) {
      return NextResponse.json([]);
    }

    const students =
      await prisma.student.findMany({
        where: {
          schoolId: user.schoolId,
          classId: {
            in: classIds,
          },
        },
        select: {
          id: true,
          studentNumber: true,
          firstName: true,
          lastName: true,
          class: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [
          {
            firstName: "asc",
          },
          {
            lastName: "asc",
          },
        ],
      });

    return NextResponse.json(students);
  } catch (error) {
    console.error(
      "GET /api/teacher/students error:",
      error
    );

    return NextResponse.json(
      { error: "Failed to load students." },
      { status: 500 }
    );
  }
}