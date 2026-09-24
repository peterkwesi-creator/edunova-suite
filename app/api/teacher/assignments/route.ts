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

  // Automatically link teacher account if necessary
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

export async function GET() {
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

    const assignments =
      await prisma.assignment.findMany({
        where: {
          teacherId: teacher.id,
          class: {
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
          submissions: {
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
            orderBy: {
              submittedAt: "desc",
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
      "TEACHER ASSIGNMENTS GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load teacher assignments.",
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

    const title =
      typeof body.title === "string"
        ? body.title.trim()
        : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    const classId =
      typeof body.classId === "string"
        ? body.classId
        : "";

    const subjectId =
      typeof body.subjectId === "string"
        ? body.subjectId
        : "";

    const dueDate =
      typeof body.dueDate === "string" &&
      body.dueDate.trim()
        ? new Date(body.dueDate)
        : null;

    if (!title) {
      return NextResponse.json(
        {
          error:
            "Assignment title is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!classId) {
      return NextResponse.json(
        {
          error: "Class is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!subjectId) {
      return NextResponse.json(
        {
          error: "Subject is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      dueDate &&
      Number.isNaN(dueDate.getTime())
    ) {
      return NextResponse.json(
        {
          error: "Invalid due date.",
        },
        {
          status: 400,
        }
      );
    }

    const schoolClass =
      await prisma.schoolClass.findFirst({
        where: {
          id: classId,
          schoolId: user.schoolId,
        },
        select: {
          id: true,
          name: true,
        },
      });

    if (!schoolClass) {
      return NextResponse.json(
        {
          error: "Class not found.",
        },
        {
          status: 404,
        }
      );
    }

    const subject =
      await prisma.subject.findFirst({
        where: {
          id: subjectId,
          schoolId: user.schoolId,
        },
        select: {
          id: true,
          name: true,
          code: true,
        },
      });

    if (!subject) {
      return NextResponse.json(
        {
          error: "Subject not found.",
        },
        {
          status: 404,
        }
      );
    }

    // Teacher must actually teach this subject
    // to this class in the teacher's school.
    const classSubject =
      await prisma.classSubject.findFirst({
        where: {
          classId,
          subjectId,
          teacherId: teacher.id,
          class: {
            schoolId: user.schoolId,
          },
          subject: {
            schoolId: user.schoolId,
          },
        },
      });

    if (!classSubject) {
      return NextResponse.json(
        {
          error:
            "You are not assigned to teach this subject in this class.",
        },
        {
          status: 403,
        }
      );
    }

    const assignment =
      await prisma.assignment.create({
        data: {
          title,
          description: description || null,
          dueDate,
          classId,
          subjectId,
          teacherId: teacher.id,
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
        },
      });

    return NextResponse.json(
      assignment,
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "TEACHER ASSIGNMENTS POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to create assignment.",
      },
      {
        status: 500,
      }
    );
  }
}