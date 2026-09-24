import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  verifySession,
} from "@/lib/auth";

async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
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
    role: user.role,
    schoolId: user.schoolId,
  };
}

function parseDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export async function GET(request: Request) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const classId = searchParams.get("classId");
    const date = searchParams.get("date");

    if (!classId || !date) {
      return NextResponse.json(
        {
          error: "classId and date are required",
        },
        { status: 400 }
      );
    }

    const selectedDate = parseDate(date);

    if (!selectedDate) {
      return NextResponse.json(
        { error: "Invalid date" },
        { status: 400 }
      );
    }

    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const schoolClass =
      await prisma.schoolClass.findFirst({
        where: {
          id: classId,
          schoolId: session.schoolId,
        },
        select: {
          id: true,
          name: true,
        },
      });

    if (!schoolClass) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }

    const students =
      await prisma.student.findMany({
        where: {
          classId,
          schoolId: session.schoolId,
        },
        orderBy: [
          { firstName: "asc" },
          { lastName: "asc" },
        ],
      });

    const attendance =
      await prisma.attendance.findMany({
        where: {
          classId,
          schoolId: session.schoolId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

    const attendanceMap = new Map(
      attendance.map((item) => [
        item.studentId,
        item,
      ])
    );

    const result = students.map((student) => {
      const record = attendanceMap.get(
        student.id
      );

      return {
        studentId: student.id,
        studentNumber: student.studentNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        status:
          record?.status ?? "PRESENT",
        remarks:
          record?.remarks ?? "",
        attendanceId:
          record?.id ?? null,
      };
    });

    return NextResponse.json({
      class: schoolClass,
      date,
      students: result,
    });
  } catch (error) {
    console.error(
      "Admin attendance GET error:",
      error
    );

    return NextResponse.json(
      { error: "Failed to load attendance" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      classId,
      date,
      records,
    } = body;

    if (
      typeof classId !== "string" ||
      !classId.trim() ||
      typeof date !== "string" ||
      !date.trim() ||
      !Array.isArray(records)
    ) {
      return NextResponse.json(
        {
          error:
            "classId, date and records are required",
        },
        { status: 400 }
      );
    }

    const selectedDate = parseDate(date);

    if (!selectedDate) {
      return NextResponse.json(
        { error: "Invalid date" },
        { status: 400 }
      );
    }

    const attendanceDate =
      new Date(selectedDate);

    attendanceDate.setHours(0, 0, 0, 0);

    const schoolClass =
      await prisma.schoolClass.findFirst({
        where: {
          id: classId,
          schoolId: session.schoolId,
        },
        select: {
          id: true,
        },
      });

    if (!schoolClass) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }

    const validStatuses = [
      "PRESENT",
      "ABSENT",
      "LATE",
      "EXCUSED",
    ];

    if (records.length === 0) {
      return NextResponse.json({
        message: "Attendance saved successfully",
      });
    }

    const normalizedRecords = records.map(
      (record: unknown) => {
        if (
          !record ||
          typeof record !== "object"
        ) {
          return null;
        }

        const item =
          record as Record<string, unknown>;

        return {
          studentId:
            typeof item.studentId ===
            "string"
              ? item.studentId
              : "",
          status:
            typeof item.status ===
            "string"
              ? item.status
              : "",
          remarks:
            typeof item.remarks ===
            "string"
              ? item.remarks.trim()
              : "",
        };
      }
    );

    if (
      normalizedRecords.some(
        (record) =>
          !record ||
          !record.studentId ||
          !record.status
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Every attendance record must contain a studentId and status.",
        },
        { status: 400 }
      );
    }

    const studentIds =
      normalizedRecords.map(
        (record) =>
          record!.studentId
      );

    const uniqueStudentIds =
      new Set(studentIds);

    if (
      uniqueStudentIds.size !==
      studentIds.length
    ) {
      return NextResponse.json(
        {
          error:
            "A student cannot appear more than once in the same attendance submission.",
        },
        { status: 400 }
      );
    }

    const students =
      await prisma.student.findMany({
        where: {
          id: {
            in: studentIds,
          },
          classId,
          schoolId: session.schoolId,
        },
        select: {
          id: true,
        },
      });

    const validStudentIds = new Set(
      students.map(
        (student) => student.id
      )
    );

    for (const record of normalizedRecords) {
      if (
        !record ||
        !validStudentIds.has(
          record.studentId
        )
      ) {
        return NextResponse.json(
          {
            error:
              "One or more students do not belong to this class.",
          },
          { status: 400 }
        );
      }

      if (
        !validStatuses.includes(
          record.status
        )
      ) {
        return NextResponse.json(
          {
            error: `Invalid attendance status for student ${record.studentId}`,
          },
          { status: 400 }
        );
      }
    }

    await prisma.$transaction(
      normalizedRecords.map(
        (record) =>
          prisma.attendance.upsert({
            where: {
              studentId_date: {
                studentId:
                  record!.studentId,
                date: attendanceDate,
              },
            },
            update: {
              classId,
              schoolId:
                session.schoolId,
              status:
                record!.status,
              remarks:
                record!.remarks ||
                null,
            },
            create: {
              studentId:
                record!.studentId,
              classId,
              schoolId:
                session.schoolId,
              date: attendanceDate,
              status:
                record!.status,
              remarks:
                record!.remarks ||
                null,
            },
          })
      )
    );

    return NextResponse.json({
      message:
        "Attendance saved successfully",
    });
  } catch (error) {
    console.error(
      "Admin attendance POST error:",
      error
    );

    return NextResponse.json(
      { error: "Failed to save attendance" },
      { status: 500 }
    );
  }
}