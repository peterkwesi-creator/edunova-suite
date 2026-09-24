import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  verifySession,
} from "@/lib/auth";

async function getTeacherSession() {
  const cookieStore = await cookies();

  const token =
    cookieStore.get(SESSION_COOKIE)?.value;

  const session = verifySession(token);

  if (!session || session.role !== "TEACHER") {
    return null;
  }

  return session;
}

export async function GET() {
  try {
    const session = await getTeacherSession();

    if (!session) {
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

    if (!user.teacherId) {
      return NextResponse.json(
        {
          error:
            "Your account is not linked to a teacher profile.",
        },
        { status: 404 }
      );
    }

    const notes =
      await prisma.studentNote.findMany({
        where: {
          schoolId: user.schoolId,
          authorId: user.id,
        },
        include: {
          student: {
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
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json(notes);
  } catch (error) {
    console.error(
      "GET /api/teacher/notes error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to load teacher notes.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getTeacherSession();

    if (!session) {
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

    if (!user.teacherId) {
      return NextResponse.json(
        {
          error:
            "Your account is not linked to a teacher profile.",
        },
        { status: 404 }
      );
    }

    const body = await request.json();

    const studentId =
      typeof body.studentId === "string"
        ? body.studentId.trim()
        : "";

    const title =
      typeof body.title === "string"
        ? body.title.trim()
        : "";

    const content =
      typeof body.content === "string"
        ? body.content.trim()
        : "";

    if (!studentId) {
      return NextResponse.json(
        { error: "Student is required." },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { error: "Note title is required." },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json(
        { error: "Note content is required." },
        { status: 400 }
      );
    }

    const student =
      await prisma.student.findFirst({
        where: {
          id: studentId,
          schoolId: user.schoolId,
        },
        select: {
          id: true,
          classId: true,
        },
      });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found." },
        { status: 404 }
      );
    }

    if (!student.classId) {
      return NextResponse.json(
        {
          error:
            "This student is not currently assigned to a class.",
        },
        { status: 400 }
      );
    }

    const studentClassId = student.classId;

    const classSubject =
      await prisma.classSubject.findFirst({
        where: {
          teacherId: user.teacherId,
          classId: studentClassId,
          class: {
            schoolId: user.schoolId,
          },
        },
        select: {
          id: true,
        },
      });

    if (!classSubject) {
      return NextResponse.json(
        {
          error:
            "You are not assigned to this student's class.",
        },
        { status: 403 }
      );
    }

    const note =
      await prisma.studentNote.create({
        data: {
          schoolId: user.schoolId,
          authorId: user.id,
          studentId: student.id,
          title,
          content,
        },
        include: {
          student: {
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
          },
        },
      });

    return NextResponse.json(
      note,
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/teacher/notes error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to create teacher note.",
      },
      { status: 500 }
    );
  }
}