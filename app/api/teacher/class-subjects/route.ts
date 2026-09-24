import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  verifySession,
  SESSION_COOKIE,
} from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get(
      SESSION_COOKIE
    )?.value;

    const session = verifySession(token);

    if (
      !session ||
      session.role !== "TEACHER"
    ) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    const user =
      await prisma.user.findUnique({
        where: {
          id: session.userId,
        },
        select: {
          id: true,
          email: true,
          schoolId: true,
          teacherId: true,
        },
      });

    if (!user) {
      return NextResponse.json(
        {
          error: "User account not found.",
        },
        {
          status: 401,
        }
      );
    }

    let teacher = null;

    if (user.teacherId) {
      teacher =
        await prisma.teacher.findFirst({
          where: {
            id: user.teacherId,
            schoolId: user.schoolId,
          },
        });
    }

    if (!teacher && user.email) {
      teacher =
        await prisma.teacher.findFirst({
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

    if (!teacher) {
      return NextResponse.json(
        {
          error:
            "Teacher profile not found.",
        },
        {
          status: 404,
        }
      );
    }

    const classSubjects =
      await prisma.classSubject.findMany({
        where: {
          teacherId: teacher.id,

          class: {
            schoolId: user.schoolId,
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
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json(
      classSubjects
    );
  } catch (error) {
    console.error(
      "TEACHER CLASS SUBJECTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load teacher classes and subjects.",
      },
      {
        status: 500,
      }
    );
  }
}