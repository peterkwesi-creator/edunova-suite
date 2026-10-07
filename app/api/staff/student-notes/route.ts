import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  verifySession,
  type SessionUser,
} from "@/lib/auth";

type StaffSession = {
  userId: string;
  schoolId: string;
  role: SessionUser["role"];
};

async function getStaffSession(): Promise<StaffSession | null> {
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

  return {
    userId: session.userId,
    schoolId: session.schoolId,
    role: session.role,
  };
}

async function getTeacher(
  session: StaffSession
) {
  const user = await prisma.user.findFirst({
    where: {
      id: session.userId,
      schoolId: session.schoolId,
      active: true,
    },
    select: {
      id: true,
      email: true,
      teacherId: true,
    },
  });

  if (!user) {
    return null;
  }

  if (user.teacherId) {
    const teacher =
      await prisma.teacher.findFirst({
        where: {
          id: user.teacherId,
          schoolId: session.schoolId,
        },
      });

    if (teacher) {
      return teacher;
    }
  }

  if (user.email) {
    const teacher =
      await prisma.teacher.findFirst({
        where: {
          schoolId: session.schoolId,
          email: user.email,
        },
      });

    if (teacher) {
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          teacherId: teacher.id,
        },
      });

      return teacher;
    }
  }

  return null;
}

export async function GET(
  request: Request
) {
  try {
    const session =
      await getStaffSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } =
      new URL(request.url);

    const studentId =
      searchParams.get("studentId");

    const notes =
      await prisma.studentNote.findMany({
        where: {
          schoolId: session.schoolId,
          ...(studentId
            ? { studentId }
            : {}),
          ...(session.role === "TEACHER"
            ? {
                authorId:
                  session.userId,
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
    const session =
      await getStaffSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const studentId =
      typeof body.studentId === "string"
        ? body.studentId.trim()
        : "";

    const classId =
      typeof body.classId === "string"
        ? body.classId.trim()
        : "";

    const title =
      typeof body.title === "string"
        ? body.title.trim()
        : "";

    const content =
      typeof body.content === "string"
        ? body.content.trim()
        : "";

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

    /*
     * CLASS-WIDE NOTE
     *
     * Teachers may only send a note to classes
     * they are actually assigned to.
     */
    if (classId) {
      if (session.role !== "TEACHER") {
        return NextResponse.json(
          {
            error:
              "Only teachers can send class-wide notes.",
          },
          { status: 403 }
        );
      }

      const teacher =
        await getTeacher(session);

      if (!teacher) {
        return NextResponse.json(
          {
            error:
              "Teacher profile not found.",
          },
          { status: 404 }
        );
      }

      const classAssignment =
        await prisma.classSubject.findFirst({
          where: {
            teacherId: teacher.id,
            classId,
            class: {
              schoolId:
                session.schoolId,
            },
          },
          select: {
            id: true,
          },
        });

      if (!classAssignment) {
        return NextResponse.json(
          {
            error:
              "You are not assigned to this class.",
          },
          { status: 403 }
        );
      }

      const students =
        await prisma.student.findMany({
          where: {
            schoolId:
              session.schoolId,
            classId,
          },
          select: {
            id: true,
          },
        });

      if (students.length === 0) {
        return NextResponse.json(
          {
            error:
              "There are no students in this class.",
          },
          { status: 400 }
        );
      }

      await prisma.studentNote.createMany({
        data: students.map(
          (student) => ({
            schoolId:
              session.schoolId,
            studentId:
              student.id,
            authorId:
              session.userId,
            title,
            content,
          })
        ),
      });

      return NextResponse.json(
        {
          success: true,
          scope: "class",
          classId,
          count: students.length,
          message: `Note sent to ${students.length} student${
            students.length === 1
              ? ""
              : "s"
          }.`,
        },
        { status: 201 }
      );
    }

    /*
     * INDIVIDUAL STUDENT NOTE
     */
    if (!studentId) {
      return NextResponse.json(
        {
          error:
            "Select a student or a class.",
        },
        { status: 400 }
      );
    }

    const student =
      await prisma.student.findFirst({
        where: {
          id: studentId,
          schoolId:
            session.schoolId,
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

    const note =
      await prisma.studentNote.create({
        data: {
          schoolId:
            session.schoolId,
          studentId,
          authorId:
            session.userId,
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