import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";

async function getTeacher() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = verifySession(token);

  if (!session || session.role !== "TEACHER") {
    return null;
  }

  const user = await prisma.user.findFirst({
    where: {
      id: session.userId,
      schoolId: session.schoolId,
      active: true,
    },
    select: {
      id: true,
      email: true,
      schoolId: true,
      teacherId: true,
    },
  });

  if (!user) return null;

  let teacher = null;

  if (user.teacherId) {
    teacher = await prisma.teacher.findFirst({
      where: {
        id: user.teacherId,
        schoolId: user.schoolId,
      },
    });
  }

  if (!teacher && user.email) {
    teacher = await prisma.teacher.findFirst({
      where: {
        email: user.email,
        schoolId: user.schoolId,
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
    }
  }

  if (!teacher) return null;

  return {
    user,
    teacher,
  };
}

export async function GET(request: Request) {
  try {
    const result = await getTeacher();

    if (!result) {
      return NextResponse.json(
        {
          error:
            "Unauthorized or teacher profile not found.",
        },
        {
          status: 401,
        }
      );
    }

    const { user, teacher } = result;

    const { searchParams } = new URL(request.url);
    const assignmentId =
      searchParams.get("assignmentId");

    if (!assignmentId) {
      return NextResponse.json(
        {
          error: "Assignment ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const assignment =
      await prisma.assignment.findFirst({
        where: {
          id: assignmentId,
          teacherId: teacher.id,
          class: {
            schoolId: user.schoolId,
          },
        },
        select: {
          id: true,
          title: true,
        },
      });

    if (!assignment) {
      return NextResponse.json(
        {
          error: "Assignment not found.",
        },
        {
          status: 404,
        }
      );
    }

    const submissions =
      await prisma.submission.findMany({
        where: {
          assignmentId: assignment.id,
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
          submittedAt: "desc",
        },
      });

    return NextResponse.json(submissions);
  } catch (error) {
    console.error(
      "TEACHER SUBMISSIONS GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to load submissions.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    const result = await getTeacher();

    if (!result) {
      return NextResponse.json(
        {
          error:
            "Unauthorized or teacher profile not found.",
        },
        {
          status: 401,
        }
      );
    }

    const { user, teacher } = result;

    const body = await request.json();

    const assignmentId =
      typeof body.assignmentId === "string"
        ? body.assignmentId
        : "";

    const submissionId =
      typeof body.submissionId === "string"
        ? body.submissionId
        : "";

    const feedback =
      typeof body.feedback === "string"
        ? body.feedback.trim()
        : "";

    const rawGrade = body.grade;

    if (!assignmentId) {
      return NextResponse.json(
        {
          error: "Assignment ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!submissionId) {
      return NextResponse.json(
        {
          error: "Submission ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const grade = Number(rawGrade);

    if (!Number.isFinite(grade)) {
      return NextResponse.json(
        {
          error: "Grade must be a valid number.",
        },
        {
          status: 400,
        }
      );
    }

    if (grade < 0 || grade > 100) {
      return NextResponse.json(
        {
          error: "Grade must be between 0 and 100.",
        },
        {
          status: 400,
        }
      );
    }

    const assignment =
      await prisma.assignment.findFirst({
        where: {
          id: assignmentId,
          teacherId: teacher.id,
          class: {
            schoolId: user.schoolId,
          },
        },
      });

    if (!assignment) {
      return NextResponse.json(
        {
          error: "Assignment not found.",
        },
        {
          status: 404,
        }
      );
    }

    const submission =
      await prisma.submission.findFirst({
        where: {
          id: submissionId,
          assignmentId: assignment.id,
          student: {
            schoolId: user.schoolId,
          },
        },
      });

    if (!submission) {
      return NextResponse.json(
        {
          error: "Submission not found.",
        },
        {
          status: 404,
        }
      );
    }

    const updatedSubmission =
      await prisma.submission.update({
        where: {
          id: submission.id,
        },
        data: {
          grade,
          feedback: feedback || null,
          status: "GRADED",
        },
        include: {
          student: {
            select: {
              id: true,
              studentNumber: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

    return NextResponse.json(
      updatedSubmission
    );
  } catch (error) {
    console.error(
      "TEACHER SUBMISSIONS POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to grade submission.",
      },
      {
        status: 500,
      }
    );
  }
}