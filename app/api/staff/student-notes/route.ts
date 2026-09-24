import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  verifySession,
} from "@/lib/auth";

async function getStaffSession() {
  const cookieStore = await cookies();

  const token =
    cookieStore.get(SESSION_COOKIE)?.value;

  const session = verifySession(token);

  if (!session) {
    return null;
  }

  if (
    session.role !== "ADMIN" &&
    session.role !== "SUPER_ADMIN" &&
    session.role !== "TEACHER"
  ) {
    return null;
  }

  const user = await prisma.user.findFirst({
    where: {
      id: session.userId,
      schoolId: session.schoolId,
      active: true,
      role: session.role,
    },
    select: {
      id: true,
      schoolId: true,
      role: true,
      teacherId: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    session,
    user,
  };
}

async function teacherCanAccessStudent(
  teacherId: string,
  studentId: string,
  schoolId: string
) {
  const student =
    await prisma.student.findFirst({
      where: {
        id: studentId,
        schoolId,
      },
      select: {
        id: true,
        classId: true,
      },
    });

  if (!student?.classId) {
    return null;
  }

  const classSubject =
    await prisma.classSubject.findFirst({
      where: {
        teacherId,
        classId: student.classId,
        class: {
          schoolId,
        },
        subject: {
          schoolId,
        },
      },
      select: {
        id: true,
      },
    });

  if (!classSubject) {
    return null;
  }

  return student;
}

export async function GET(
  request: Request
) {
  try {
    const result =
      await getStaffSession();

    if (!result) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { session, user } = result;

    const { searchParams } =
      new URL(request.url);

    const studentId =
      searchParams.get("studentId");

    if (
      studentId &&
      session.role === "TEACHER"
    ) {
      if (!user.teacherId) {
        return NextResponse.json(
          {
            error:
              "Your account is not linked to a teacher profile.",
          },
          { status: 403 }
        );
      }

      const student =
        await teacherCanAccessStudent(
          user.teacherId,
          studentId,
          session.schoolId
        );

      if (!student) {
        return NextResponse.json(
          {
            error:
              "You are not authorized to view notes for this student.",
          },
          { status: 403 }
        );
      }
    }

    if (
      studentId &&
      session.role !== "TEACHER"
    ) {
      const student =
        await prisma.student.findFirst({
          where: {
            id: studentId,
            schoolId: session.schoolId,
          },
          select: {
            id: true,
          },
        });

      if (!student) {
        return NextResponse.json(
          {
            error:
              "Student not found.",
          },
          { status: 404 }
        );
      }
    }

    const notes =
      await prisma.studentNote.findMany({
        where: {
          schoolId: session.schoolId,

          ...(studentId
            ? {
                studentId,
              }
            : {}),

          ...(session.role === "TEACHER"
            ? {
                authorId: user.id,
              }
            : {}),
        },

        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              studentNumber: true,
            },
          },

          author: {
            select: {
              id: true,
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

    return NextResponse.json(notes);
  } catch (error) {
    console.error(
      "GET /api/staff/student-notes error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load student notes.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    const result =
      await getStaffSession();

    if (!result) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { session, user } = result;

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
        {
          error: "Student is required.",
        },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        {
          error:
            "Note title is required.",
        },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json(
        {
          error:
            "Note content is required.",
        },
        { status: 400 }
      );
    }

    if (title.length > 200) {
      return NextResponse.json(
        {
          error:
            "Note title is too long.",
        },
        { status: 400 }
      );
    }

    let student;

    if (session.role === "TEACHER") {
      if (!user.teacherId) {
        return NextResponse.json(
          {
            error:
              "Your account is not linked to a teacher profile.",
          },
          { status: 403 }
        );
      }

      student =
        await teacherCanAccessStudent(
          user.teacherId,
          studentId,
          session.schoolId
        );

      if (!student) {
        return NextResponse.json(
          {
            error:
              "You are not authorized to create a note for this student.",
          },
          { status: 403 }
        );
      }
    } else {
      student =
        await prisma.student.findFirst({
          where: {
            id: studentId,
            schoolId: session.schoolId,
          },
          select: {
            id: true,
          },
        });

      if (!student) {
        return NextResponse.json(
          {
            error:
              "Student not found.",
          },
          { status: 404 }
        );
      }
    }

    const note =
      await prisma.studentNote.create({
        data: {
          schoolId: session.schoolId,
          studentId,
          authorId: user.id,
          title,
          content,
        },

        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              studentNumber: true,
            },
          },

          author: {
            select: {
              firstName: true,
              lastName: true,
              role: true,
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
      "POST /api/staff/student-notes error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to create student note.",
      },
      { status: 500 }
    );
  }
}