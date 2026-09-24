import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  verifySession,
} from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
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

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Student ID is required." },
        { status: 400 }
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

    const classSubjects =
      await prisma.classSubject.findMany({
        where: {
          teacherId: user.teacherId,
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
      return NextResponse.json(
        { error: "Student not found." },
        { status: 404 }
      );
    }

    const student =
      await prisma.student.findFirst({
        where: {
          id,
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
          email: true,
          phone: true,
          dateOfBirth: true,
          gender: true,
          address: true,
          class: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found." },
        { status: 404 }
      );
    }

    if (!student.class) {
      return NextResponse.json(
        {
          error:
            "This student is not currently assigned to a class.",
        },
        { status: 404 }
      );
    }

    const studentClass = student.class;

    const results = await prisma.result.findMany({
      where: {
        studentId: student.id,
        student: {
          schoolId: user.schoolId,
        },
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const assignments =
      await prisma.assignment.findMany({
        where: {
          teacherId: user.teacherId,
          classId: studentClass.id,
          class: {
            schoolId: user.schoolId,
          },
          subject: {
            schoolId: user.schoolId,
          },
        },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          submissions: {
            where: {
              studentId: student.id,
            },
            select: {
              id: true,
              answer: true,
              status: true,
              grade: true,
              feedback: true,
              submittedAt: true,
              updatedAt: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    const notes =
      await prisma.studentNote.findMany({
        where: {
          schoolId: user.schoolId,
          studentId: student.id,
          authorId: user.id,
        },
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json({
      student: {
        ...student,
        class: studentClass,
      },
      results,
      assignments,
      notes,
    });
  } catch (error) {
    console.error(
      "GET /api/teacher/students/[id] error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load student profile.",
      },
      { status: 500 }
    );
  }
}