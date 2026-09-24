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
    const result = await getStudent();

    if (!result) {
      return NextResponse.json(
        {
          error:
            "Unauthorized or student profile not found.",
        },
        { status: 401 }
      );
    }

    const { user, student } = result;
    const { id } = await context.params;

    const assignment =
      await prisma.assignment.findFirst({
        where: {
          id,
          classId: student.classId ?? undefined,
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
      });

    if (!assignment) {
      return NextResponse.json(
        {
          error: "Assignment not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(assignment);
  } catch (error) {
    console.error(
      "STUDENT ASSIGNMENT GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to load assignment.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const result = await getStudent();

    if (!result) {
      return NextResponse.json(
        {
          error:
            "Unauthorized or student profile not found.",
        },
        { status: 401 }
      );
    }

    const { user, student } = result;
    const { id } = await context.params;

    if (!student.classId) {
      return NextResponse.json(
        {
          error:
            "Student is not assigned to a class.",
        },
        { status: 400 }
      );
    }

    const assignment =
      await prisma.assignment.findFirst({
        where: {
          id,
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
      });

    if (!assignment) {
      return NextResponse.json(
        {
          error: "Assignment not found.",
        },
        { status: 404 }
      );
    }

    const body = await request.json();

    const answer =
      typeof body.answer === "string"
        ? body.answer.trim()
        : "";

    if (!answer) {
      return NextResponse.json(
        {
          error:
            "Please provide an answer before submitting.",
        },
        { status: 400 }
      );
    }

    if (answer.length > 100000) {
      return NextResponse.json(
        {
          error:
            "Answer is too long. Please keep it under 100,000 characters.",
        },
        { status: 400 }
      );
    }

    if (
      assignment.dueDate &&
      new Date() > assignment.dueDate
    ) {
      return NextResponse.json(
        {
          error:
            "The deadline for this assignment has passed.",
        },
        { status: 400 }
      );
    }

    const submission =
      await prisma.submission.upsert({
        where: {
          assignmentId_studentId: {
            assignmentId: assignment.id,
            studentId: student.id,
          },
        },
        update: {
          answer,
          status: "SUBMITTED",
          submittedAt: new Date(),
        },
        create: {
          assignmentId: assignment.id,
          studentId: student.id,
          answer,
          status: "SUBMITTED",
        },
        select: {
          id: true,
          assignmentId: true,
          studentId: true,
          answer: true,
          status: true,
          grade: true,
          feedback: true,
          submittedAt: true,
          updatedAt: true,
        },
      });

    return NextResponse.json(submission);
  } catch (error) {
    console.error(
      "STUDENT ASSIGNMENT SUBMIT ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to submit assignment.",
      },
      { status: 500 }
    );
  }
}