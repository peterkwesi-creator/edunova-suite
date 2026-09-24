import {
  NextRequest,
  NextResponse,
} from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  verifySession,
  SESSION_COOKIE,
} from "@/lib/auth";

async function getAdminSession() {
  const cookieStore =
    await cookies();

  const session =
    verifySession(
      cookieStore.get(
        SESSION_COOKIE
      )?.value
    );

  if (
    !session ||
    (
      session.role !== "ADMIN" &&
      session.role !== "SUPER_ADMIN"
    )
  ) {
    return null;
  }

  const user =
    await prisma.user.findFirst({
      where: {
        id: session.userId,
        schoolId:
          session.schoolId,
        role: session.role,
        active: true,
      },
      select: {
        id: true,
      },
    });

  return user
    ? session
    : null;
}

export async function GET() {
  try {
    const session =
      await getAdminSession();

    if (!session) {
      return NextResponse.json(
        {
          error:
            "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const assignments =
      await prisma.classSubject.findMany({
        where: {
          class: {
            schoolId:
              session.schoolId,
          },
          subject: {
            schoolId:
              session.schoolId,
          },
          teacher: {
            schoolId:
              session.schoolId,
          },
        },
        select: {
          id: true,
          classId: true,
          subjectId: true,
          teacherId: true,

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
              employeeNumber: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json(
      assignments
    );
  } catch (error) {
    console.error(
      "GET CLASS SUBJECTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load class subject assignments.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const session =
      await getAdminSession();

    if (!session) {
      return NextResponse.json(
        {
          error:
            "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const body =
      await request.json();

    const classId =
      typeof body.classId ===
      "string"
        ? body.classId.trim()
        : "";

    const subjectId =
      typeof body.subjectId ===
      "string"
        ? body.subjectId.trim()
        : "";

    const teacherId =
      typeof body.teacherId ===
        "string" &&
      body.teacherId.trim()
        ? body.teacherId.trim()
        : null;

    if (!classId || !subjectId) {
      return NextResponse.json(
        {
          error:
            "Class and subject are required.",
        },
        { status: 400 }
      );
    }

    const schoolClass =
      await prisma.schoolClass.findFirst({
        where: {
          id: classId,
          schoolId:
            session.schoolId,
        },
      });

    if (!schoolClass) {
      return NextResponse.json(
        {
          error:
            "Class not found.",
        },
        { status: 404 }
      );
    }

    const subject =
      await prisma.subject.findFirst({
        where: {
          id: subjectId,
          schoolId:
            session.schoolId,
        },
      });

    if (!subject) {
      return NextResponse.json(
        {
          error:
            "Subject not found.",
        },
        { status: 404 }
      );
    }

    if (teacherId) {
      const teacher =
        await prisma.teacher.findFirst({
          where: {
            id: teacherId,
            schoolId:
              session.schoolId,
          },
        });

      if (!teacher) {
        return NextResponse.json(
          {
            error:
              "Teacher not found.",
          },
          { status: 404 }
        );
      }
    }

    const existing =
      await prisma.classSubject.findUnique({
        where: {
          classId_subjectId: {
            classId,
            subjectId,
          },
        },
      });

    if (existing) {
      const updated =
        await prisma.classSubject.update({
          where: {
            id: existing.id,
          },
          data: {
            teacherId,
          },
          select: {
            id: true,
            classId: true,
            subjectId: true,
            teacherId: true,

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
                employeeNumber: true,
              },
            },
          },
        });

      return NextResponse.json(
        updated
      );
    }

    const assignment =
      await prisma.classSubject.create({
        data: {
          classId,
          subjectId,
          teacherId,
        },
        select: {
          id: true,
          classId: true,
          subjectId: true,
          teacherId: true,

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
              employeeNumber: true,
            },
          },
        },
      });

    return NextResponse.json(
      assignment,
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "CREATE CLASS SUBJECT ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to assign subject to class.",
      },
      { status: 500 }
    );
  }
}