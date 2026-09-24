import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  verifySession,
} from "@/lib/auth";

async function getAdminSession() {
  const cookieStore = await cookies();
  const token =
    cookieStore.get(SESSION_COOKIE)?.value;

  const session = verifySession(token);

  if (
    !session ||
    (session.role !== "ADMIN" &&
      session.role !== "SUPER_ADMIN")
  ) {
    return null;
  }

  const user = await prisma.user.findFirst({
    where: {
      id: session.userId,
      schoolId: session.schoolId,
      active: true,
      role: {
        in: ["ADMIN", "SUPER_ADMIN"],
      },
    },
    select: {
      id: true,
      schoolId: true,
      role: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    ...session,
    schoolId: user.schoolId,
    role: user.role,
  };
}

function isValidTime(value: unknown) {
  if (
    typeof value !== "string" ||
    !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(
      value
    )
  ) {
    return false;
  }

  return true;
}

export async function GET(request: Request) {
  try {
    const session =
      await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } =
      new URL(request.url);

    const academicYearId =
      searchParams.get(
        "academicYearId"
      );

    const termId =
      searchParams.get("termId");

    const classId =
      searchParams.get("classId");

    if (academicYearId) {
      const academicYear =
        await prisma.academicYear.findFirst({
          where: {
            id: academicYearId,
            schoolId:
              session.schoolId,
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
              academicYearId
                ? "Term does not belong to the selected academic year."
                : "Term not found.",
          },
          { status: 400 }
        );
      }
    }

    if (classId) {
      const schoolClass =
        await prisma.schoolClass.findFirst({
          where: {
            id: classId,
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
    }

    const entries =
      await prisma.timetableEntry.findMany({
        where: {
          schoolId:
            session.schoolId,
          ...(academicYearId
            ? { academicYearId }
            : {}),
          ...(termId
            ? { termId }
            : {}),
          ...(classId
            ? { classId }
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
      "GET /api/admin/timetable error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load timetable",
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
      await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body =
      await request.json();

    const {
      academicYearId,
      termId,
      classId,
      subjectId,
      teacherId,
      dayOfWeek,
      startTime,
      endTime,
      room,
      notes,
    } = body;

    if (
      !academicYearId ||
      !termId ||
      !classId ||
      !subjectId ||
      dayOfWeek === undefined ||
      !startTime ||
      !endTime
    ) {
      return NextResponse.json(
        {
          error:
            "Academic year, term, class, subject, day, start time and end time are required.",
        },
        { status: 400 }
      );
    }

    const day =
      Number(dayOfWeek);

    if (
      !Number.isInteger(day) ||
      day < 1 ||
      day > 5
    ) {
      return NextResponse.json(
        {
          error:
            "Day of week must be between Monday and Friday.",
        },
        { status: 400 }
      );
    }

    if (
      !isValidTime(startTime) ||
      !isValidTime(endTime)
    ) {
      return NextResponse.json(
        {
          error:
            "Start time and end time must use HH:mm format.",
        },
        { status: 400 }
      );
    }

    if (startTime >= endTime) {
      return NextResponse.json(
        {
          error:
            "End time must be after start time.",
        },
        { status: 400 }
      );
    }

    const academicYear =
      await prisma.academicYear.findFirst({
        where: {
          id: academicYearId,
          schoolId:
            session.schoolId,
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

    const term =
      await prisma.term.findFirst({
        where: {
          id: termId,
          academicYearId,
        },
      });

    if (!term) {
      return NextResponse.json(
        {
          error:
            "Term does not belong to this academic year.",
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
          error: "Class not found.",
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

    const classSubject =
      await prisma.classSubject.findFirst({
        where: {
          classId,
          subjectId,
        },
        select: {
          id: true,
        },
      });

    if (!classSubject) {
      return NextResponse.json(
        {
          error:
            "This subject is not assigned to the selected class.",
        },
        { status: 400 }
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
    }

    const overlap = {
      startTime: {
        lt: endTime,
      },
      endTime: {
        gt: startTime,
      },
    };

    const classConflict =
      await prisma.timetableEntry.findFirst({
        where: {
          schoolId:
            session.schoolId,
          academicYearId,
          termId,
          classId,
          dayOfWeek: day,
          OR: [overlap],
        },
      });

    if (classConflict) {
      return NextResponse.json(
        {
          error:
            "This class already has a timetable entry during that time.",
        },
        { status: 409 }
      );
    }

    if (teacherId) {
      const teacherConflict =
        await prisma.timetableEntry.findFirst({
          where: {
            schoolId:
              session.schoolId,
            academicYearId,
            termId,
            teacherId,
            dayOfWeek: day,
            OR: [overlap],
          },
        });

      if (teacherConflict) {
        return NextResponse.json(
          {
            error:
              "This teacher already has a timetable entry during that time.",
          },
          { status: 409 }
        );
      }
    }

    const entry =
      await prisma.timetableEntry.create({
        data: {
          schoolId:
            session.schoolId,
          academicYearId,
          termId,
          classId,
          subjectId,
          teacherId:
            teacherId || null,
          dayOfWeek: day,
          startTime,
          endTime,
          room:
            typeof room ===
            "string"
              ? room.trim() || null
              : null,
          notes:
            typeof notes ===
            "string"
              ? notes.trim() || null
              : null,
        },
        include: {
          class: true,
          subject: true,
          teacher: true,
        },
      });

    return NextResponse.json(
      entry,
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/admin/timetable error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to create timetable entry",
      },
      { status: 500 }
    );
  }
}