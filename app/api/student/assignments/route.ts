import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  verifySession,
  SESSION_COOKIE,
} from "@/lib/auth";

async function getStudent() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = verifySession(token);

  if (!session || session.role !== "STUDENT") {
    return null;
  }

  const user = await prisma.user.findFirst({
    where: {
      id: session.userId,
      schoolId: session.schoolId,
      role: "STUDENT",
      active: true,
    },
    select: {
      id: true,
      email: true,
      schoolId: true,
      studentId: true,
    },
  });

  if (!user) return null;

  let student = null;

  if (user.studentId) {
    student = await prisma.student.findFirst({
      where: {
        id: user.studentId,
        schoolId: user.schoolId,
      },
    });
  }

  if (!student && user.email) {
    student = await prisma.student.findFirst({
      where: {
        email: user.email,
        schoolId: user.schoolId,
      },
    });

    if (student) {
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          studentId: student.id,
        },
      });
    }
  }

  if (!student) return null;

  return {
    user,
    student,
  };
}

export async function GET() {
  try {
    const result = await getStudent();

    if (!result) {
      return NextResponse.json(
        {
          error: "Unauthorized or student profile not found.",
        },
        { status: 401 }
      );
    }

    const { user, student } = result;

    if (!student.classId) {
      return NextResponse.json([]);
    }

    const assignments = await prisma.assignment.findMany({
      where: {
        classId: student.classId,
        class: {
          schoolId: user.schoolId,
        },
        teacher: {
          schoolId: user.schoolId,
        },
        subject: {
          schoolId: user.schoolId,
        },
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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

    return NextResponse.json(assignments);
  } catch (error) {
    console.error(
      "STUDENT ASSIGNMENTS GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to load student assignments.",
      },
      { status: 500 }
    );
  }
}