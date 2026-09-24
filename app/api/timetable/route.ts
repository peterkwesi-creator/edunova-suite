import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  verifySession,
} from "@/lib/auth";

export async function GET(
  request: Request
) {
  try {
    const cookieStore = await cookies();

    const session = verifySession(
      cookieStore.get(
        SESSION_COOKIE
      )?.value
    );

    if (!session) {
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
          active: true,
          role: session.role,
        },
        select: {
          id: true,
          teacherId: true,
          studentId: true,
          parentId: true,
        },
      });

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } =
      new URL(request.url);

    const requestedClassId =
      searchParams.get("classId");

    const requestedTeacherId =
      searchParams.get("teacherId");

    const studentId =
      searchParams.get("studentId");

    const academicYearId =
      searchParams.get(
        "academicYearId"
      );

    const termId =
      searchParams.get("termId");

    let resolvedClassId:
      | string
      | null = null;

    let resolvedTeacherId:
      | string
      | null = null;

    if (
      academicYearId
    ) {
      const academicYear =
        await prisma.academicYear.findFirst({
          where: {
            id: academicYearId,
            schoolId: session.schoolId,
          },
          select: {
            id: true,
          },
        });

      if (!academicYear) {
        return NextResponse.json(
          {
            error:
              "Academic year not found.",
          },
          { status: 404 }
        );
      }
    }

    if (termId) {
      const term =
        await prisma.term.findFirst({
          where: {
            id: termId,
            academicYear: {
              schoolId:
                session.schoolId,
              ...(academicYearId
                ? {
                    id: academicYearId,
                  }
                : {}),
            },
          },
          select: {
            id: true,
          },
        });

      if (!term) {
        return NextResponse.json(
          {
            error:
              "Term not found.",
          },
          { status: 404 }
        );
      }
    }

    if (
      session.role === "ADMIN" ||
      session.role === "SUPER_ADMIN"
    ) {
      if (requestedClassId) {
        const schoolClass =
          await prisma.schoolClass.findFirst({
            where: {
              id: requestedClassId,
              schoolId:
                session.schoolId,
            },
            select: {
              id: true,
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

        resolvedClassId =
          schoolClass.id;
      }

      if (requestedTeacherId) {
        const teacher =
          await prisma.teacher.findFirst({
            where: {
              id: requestedTeacherId,
              schoolId:
                session.schoolId,
            },
            select: {
              id: true,
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

        resolvedTeacherId =
          teacher.id;
      }
    } else if (
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

      const teacher =
        await prisma.teacher.findFirst({
          where: {
            id: user.teacherId,
            schoolId:
              session.schoolId,
          },
          select: {
            id: true,
          },
        });

      if (!teacher) {
        return NextResponse.json(
          {
            error:
              "Teacher profile not found.",
          },
          { status: 403 }
        );
      }

      resolvedTeacherId =
        teacher.id;
    } else if (
      session.role === "STUDENT"
    ) {
      if (!user.studentId) {
        return NextResponse.json(
          {
            error:
              "Your account is not linked to a student profile.",
          },
          { status: 403 }
        );
      }

      const student =
        await prisma.student.findFirst({
          where: {
            id: user.studentId,
            schoolId:
              session.schoolId,
          },
          select: {
            classId: true,
          },
        });

      if (!student?.classId) {
        return NextResponse.json(
          {
            error:
              "Student class not found.",
          },
          { status: 404 }
        );
      }

      resolvedClassId =
        student.classId;
    } else if (
      session.role === "PARENT"
    ) {
      if (!user.parentId) {
        return NextResponse.json(
          {
            error:
              "Your account is not linked to a parent profile.",
          },
          { status: 403 }
        );
      }

      if (!studentId) {
        return NextResponse.json(
          {
            error:
              "Please select a child.",
          },
          { status: 400 }
        );
      }

      const child =
        await prisma.parentStudent.findFirst({
          where: {
            parentId: user.parentId,
            studentId,
            student: {
              schoolId:
                session.schoolId,
            },
          },
          select: {
            student: {
              select: {
                classId: true,
              },
            },
          },
        });

      if (!child) {
        return NextResponse.json(
          {
            error:
              "Child not found.",
          },
          { status: 404 }
        );
      }

      if (!child.student.classId) {
        return NextResponse.json(
          {
            error:
              "Child is not assigned to a class.",
          },
          { status: 404 }
        );
      }

      resolvedClassId =
        child.student.classId;
    } else {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const entries =
      await prisma.timetableEntry.findMany({
        where: {
          schoolId: session.schoolId,

          ...(resolvedClassId
            ? {
                classId:
                  resolvedClassId,
              }
            : {}),

          ...(resolvedTeacherId
            ? {
                teacherId:
                  resolvedTeacherId,
              }
            : {}),

          ...(academicYearId
            ? {
                academicYearId,
              }
            : {}),

          ...(termId
            ? {
                termId,
              }
            : {}),
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

          academicYear: {
            select: {
              id: true,
              name: true,
            },
          },

          term: {
            select: {
              id: true,
              name: true,
            },
          },
        },

        orderBy: [
          {
            dayOfWeek: "asc",
          },
          {
            startTime: "asc",
          },
        ],
      });

    return NextResponse.json(entries);
  } catch (error) {
    console.error(
      "TIMETABLE GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load timetable.",
      },
      { status: 500 }
    );
  }
}