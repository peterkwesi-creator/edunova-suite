import {
  NextRequest,
  NextResponse,
} from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  verifySession,
} from "@/lib/auth";

export async function POST(
  request: NextRequest
) {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get(SESSION_COOKIE)?.value;

    const session = verifySession(token);

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
          schoolId: session.schoolId,
          role: "STUDENT",
          active: true,
        },
        include: {
          student: true,
        },
      });

    if (!user?.student) {
      return NextResponse.json(
        {
          error:
            "Student account not found",
        },
        { status: 404 }
      );
    }

    if (
      user.student.schoolId !==
      session.schoolId
    ) {
      return NextResponse.json(
        {
          error:
            "Student profile does not belong to this school.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const assignmentId =
      typeof body.assignmentId === "string"
        ? body.assignmentId.trim()
        : "";

    const answer =
      typeof body.answer === "string"
        ? body.answer.trim()
        : "";

    if (!assignmentId) {
      return NextResponse.json(
        {
          error:
            "Assignment ID is required",
        },
        { status: 400 }
      );
    }

    if (!answer) {
      return NextResponse.json(
        {
          error:
            "Please enter an answer before submitting.",
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

    if (!user.student.classId) {
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
          id: assignmentId,
          classId: user.student.classId,
          class: {
            schoolId: session.schoolId,
          },
          teacher: {
            schoolId: session.schoolId,
          },
          subject: {
            schoolId: session.schoolId,
          },
        },
      });

    if (!assignment) {
      return NextResponse.json(
        {
          error: "Assignment not found",
        },
        { status: 404 }
      );
    }

    if (
      assignment.dueDate &&
      assignment.dueDate.getTime() <
        Date.now()
    ) {
      return NextResponse.json(
        {
          error:
            "This assignment is past its due date and can no longer be submitted.",
        },
        { status: 400 }
      );
    }

    const submission =
      await prisma.submission.upsert({
        where: {
          assignmentId_studentId: {
            assignmentId:
              assignment.id,
            studentId:
              user.student.id,
          },
        },
        update: {
          answer,
          status: "SUBMITTED",
          submittedAt: new Date(),
          grade: null,
          feedback: null,
        },
        create: {
          assignmentId:
            assignment.id,
          studentId:
            user.student.id,
          answer,
          status: "SUBMITTED",
        },
      });

    return NextResponse.json({
      success: true,
      submission: {
        id: submission.id,
        assignmentId:
          submission.assignmentId,
        status:
          submission.status,
        submittedAt:
          submission.submittedAt,
      },
    });
  } catch (error) {
    console.error(
      "POST /api/student/assignments/submit:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to submit assignment",
      },
      { status: 500 }
    );
  }
}