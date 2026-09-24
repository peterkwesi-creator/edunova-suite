import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  verifySession,
} from "@/lib/auth";

const VALID_STATUSES = [
  "PRESENT",
  "ABSENT",
  "LATE",
  "EXCUSED",
] as const;

type AttendanceStatus =
  (typeof VALID_STATUSES)[number];

type AttendanceRecord = {
  studentId: string;
  status: string;
  remarks?: string;
};

async function getTeacher() {
  const cookieStore =
    await cookies();

  const session =
    verifySession(
      cookieStore.get(
        SESSION_COOKIE
      )?.value
    );

  if (!session) {
    return {
      session: null,
      teacher: null,
    };
  }

  if (
    session.role !==
    "TEACHER"
  ) {
    return {
      session,
      teacher: null,
    };
  }

  const user =
    await prisma.user.findFirst({
      where: {
        id: session.userId,
        schoolId:
          session.schoolId,
        role: "TEACHER",
        active: true,
      },
      select: {
        id: true,
        email: true,
        teacherId: true,
      },
    });

  if (!user) {
    return {
      session,
      teacher: null,
    };
  }

  if (user.teacherId) {
    const linkedTeacher =
      await prisma.teacher.findFirst({
        where: {
          id: user.teacherId,
          schoolId:
            session.schoolId,
        },
      });

    if (linkedTeacher) {
      return {
        session,
        teacher:
          linkedTeacher,
      };
    }
  }

  if (user.email) {
    const teacher =
      await prisma.teacher.findFirst({
        where: {
          schoolId:
            session.schoolId,
          email: user.email,
        },
      });

    if (teacher) {
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          teacherId:
            teacher.id,
        },
      });

      return {
        session,
        teacher,
      };
    }
  }

  return {
    session,
    teacher: null,
  };
}

async function verifyClassAssignment(
  classId: string,
  teacherId: string,
  schoolId: string
) {
  return prisma.classSubject.findFirst({
    where: {
      classId,
      teacherId,
      class: {
        schoolId,
      },
      subject: {
        schoolId,
      },
    },
    select: {
      classId: true,
    },
  });
}

function parseAttendanceDate(
  date: string
) {
  const match =
    /^\d{4}-\d{2}-\d{2}$/.test(
      date
    );

  if (!match) {
    return null;
  }

  const [
    year,
    month,
    day,
  ] = date
    .split("-")
    .map(Number);

  const attendanceDate =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day
      )
    );

  if (
    attendanceDate.getUTCFullYear() !==
      year ||
    attendanceDate.getUTCMonth() !==
      month - 1 ||
    attendanceDate.getUTCDate() !==
      day
  ) {
    return null;
  }

  return attendanceDate;
}

export async function GET(
  request: Request
) {
  try {
    const {
      session,
      teacher,
    } =
      await getTeacher();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (
      session.role !==
      "TEACHER"
    ) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    if (!teacher) {
      return NextResponse.json(
        {
          error:
            "Teacher profile not found",
        },
        { status: 404 }
      );
    }

    const { searchParams } =
      new URL(request.url);

    const classId =
      searchParams.get(
        "classId"
      );

    const date =
      searchParams.get(
        "date"
      );

    if (!classId || !date) {
      return NextResponse.json(
        {
          error:
            "classId and date are required",
        },
        { status: 400 }
      );
    }

    const attendanceDate =
      parseAttendanceDate(
        date
      );

    if (!attendanceDate) {
      return NextResponse.json(
        {
          error:
            "Invalid date. Use YYYY-MM-DD.",
        },
        { status: 400 }
      );
    }

    const assignment =
      await verifyClassAssignment(
        classId,
        teacher.id,
        session.schoolId
      );

    if (!assignment) {
      return NextResponse.json(
        {
          error:
            "You are not assigned to this class.",
        },
        { status: 403 }
      );
    }

    const students =
      await prisma.student.findMany({
        where: {
          schoolId:
            session.schoolId,
          classId,
        },
        select: {
          id: true,
          studentNumber: true,
          firstName: true,
          lastName: true,
          gender: true,
        },
        orderBy: [
          {
            firstName:
              "asc",
          },
          {
            lastName:
              "asc",
          },
        ],
      });

    const attendance =
      await prisma.attendance.findMany({
        where: {
          schoolId:
            session.schoolId,
          classId,
          date:
            attendanceDate,
        },
        select: {
          studentId: true,
          status: true,
          remarks: true,
        },
      });

    return NextResponse.json({
      students,
      attendance,
    });
  } catch (error) {
    console.error(
      "TEACHER ATTENDANCE GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load attendance",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    const {
      session,
      teacher,
    } =
      await getTeacher();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (
      session.role !==
      "TEACHER"
    ) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    if (!teacher) {
      return NextResponse.json(
        {
          error:
            "Teacher profile not found",
        },
        { status: 404 }
      );
    }

    const body =
      await request.json();

    const {
      classId,
      date,
      records,
    } =
      body as {
        classId?: string;
        date?: string;
        records?: AttendanceRecord[];
      };

    if (
      !classId ||
      !date ||
      !Array.isArray(records)
    ) {
      return NextResponse.json(
        {
          error:
            "classId, date and records are required",
        },
        {
          status: 400,
        }
      );
    }

    if (
      records.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "At least one attendance record is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      records.length > 1000
    ) {
      return NextResponse.json(
        {
          error:
            "Too many attendance records in one request.",
        },
        {
          status: 400,
        }
      );
    }

    const attendanceDate =
      parseAttendanceDate(
        date
      );

    if (!attendanceDate) {
      return NextResponse.json(
        {
          error:
            "Invalid date. Use YYYY-MM-DD.",
        },
        {
          status: 400,
        }
      );
    }

    const assignment =
      await verifyClassAssignment(
        classId,
        teacher.id,
        session.schoolId
      );

    if (!assignment) {
      return NextResponse.json(
        {
          error:
            "You are not assigned to this class.",
        },
        {
          status: 403,
        }
      );
    }

    const studentIds =
      new Set<string>();

    for (const record of records) {
      if (
        !record.studentId
      ) {
        return NextResponse.json(
          {
            error:
              "Each attendance record needs a studentId.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        studentIds.has(
          record.studentId
        )
      ) {
        return NextResponse.json(
          {
            error:
              "The same student cannot appear more than once in an attendance submission.",
          },
          {
            status: 400,
          }
        );
      }

      studentIds.add(
        record.studentId
      );

      if (
        !VALID_STATUSES.includes(
          record.status as AttendanceStatus
        )
      ) {
        return NextResponse.json(
          {
            error:
              `Invalid attendance status: ${record.status}`,
          },
          {
            status: 400,
          }
        );
      }

      if (
        record.remarks !==
          undefined &&
        typeof record.remarks !==
          "string"
      ) {
        return NextResponse.json(
          {
            error:
              "Attendance remarks must be text.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        typeof record.remarks ===
          "string" &&
        record.remarks.length >
          1000
      ) {
        return NextResponse.json(
          {
            error:
              "Attendance remarks are too long.",
          },
          {
            status: 400,
          }
        );
      }
    }

    const students =
      await prisma.student.findMany({
        where: {
          id: {
            in:
              Array.from(
                studentIds
              ),
          },
          schoolId:
            session.schoolId,
          classId,
        },
        select: {
          id: true,
        },
      });

    if (
      students.length !==
      studentIds.size
    ) {
      return NextResponse.json(
        {
          error:
            "One or more students do not belong to this class.",
        },
        {
          status: 400,
        }
      );
    }

    const existingAttendance =
      await prisma.attendance.findMany({
        where: {
          studentId: {
            in:
              Array.from(
                studentIds
              ),
          },
          date:
            attendanceDate,
        },
        select: {
          studentId: true,
          classId: true,
          schoolId: true,
        },
      });

    const conflictingRecord =
      existingAttendance.find(
        (record) =>
          record.classId !==
            classId ||
          record.schoolId !==
            session.schoolId
      );

    if (
      conflictingRecord
    ) {
      return NextResponse.json(
        {
          error:
            "Attendance already exists for one or more students under a different class or school. Historical attendance was not changed.",
        },
        {
          status: 409,
        }
      );
    }

    await prisma.$transaction(
      records.map(
        (record) =>
          prisma.attendance.upsert(
            {
              where: {
                studentId_date: {
                  studentId:
                    record.studentId,
                  date:
                    attendanceDate,
                },
              },
              update: {
                status:
                  record.status,
                remarks:
                  record.remarks?.trim() ||
                  null,
                classId,
                schoolId:
                  session.schoolId,
              },
              create: {
                studentId:
                  record.studentId,
                classId,
                schoolId:
                  session.schoolId,
                date:
                  attendanceDate,
                status:
                  record.status,
                remarks:
                  record.remarks?.trim() ||
                  null,
              },
            }
          )
      )
    );

    return NextResponse.json({
      success: true,
      message:
        "Attendance saved successfully.",
    });
  } catch (error) {
    console.error(
      "TEACHER ATTENDANCE POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to save attendance",
      },
      {
        status: 500,
      }
    );
  }
}