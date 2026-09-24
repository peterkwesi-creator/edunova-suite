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

export async function GET(
  request: NextRequest
) {
  try {
    const cookieStore = await cookies();

    const token =
      cookieStore.get(
        SESSION_COOKIE
      )?.value;

    const session =
      verifySession(token);

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
          student: {
            include: {
              class: true,
            },
          },
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

    const student =
      user.student;

    if (
      student.schoolId !==
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

    const month =
      request.nextUrl.searchParams.get(
        "month"
      );

    let startDate:
      | Date
      | undefined;

    let endDate:
      | Date
      | undefined;

    if (month) {
      const match =
        /^(\d{4})-(\d{2})$/.exec(
          month
        );

      if (!match) {
        return NextResponse.json(
          {
            error:
              "Invalid month format",
          },
          { status: 400 }
        );
      }

      const year =
        Number(match[1]);

      const monthNumber =
        Number(match[2]);

      if (
        monthNumber < 1 ||
        monthNumber > 12
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid month",
          },
          { status: 400 }
        );
      }

      startDate = new Date(
        Date.UTC(
          year,
          monthNumber - 1,
          1
        )
      );

      endDate = new Date(
        Date.UTC(
          year,
          monthNumber,
          1
        )
      );
    }

    const records =
      await prisma.attendance.findMany({
        where: {
          studentId:
            student.id,
          schoolId:
            session.schoolId,
          ...(startDate &&
          endDate
            ? {
                date: {
                  gte: startDate,
                  lt: endDate,
                },
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
        },
        orderBy: {
          date: "desc",
        },
      });

    const present =
      records.filter(
        (record) =>
          record.status ===
          "PRESENT"
      ).length;

    const absent =
      records.filter(
        (record) =>
          record.status ===
          "ABSENT"
      ).length;

    const late =
      records.filter(
        (record) =>
          record.status ===
          "LATE"
      ).length;

    const excused =
      records.filter(
        (record) =>
          record.status ===
          "EXCUSED"
      ).length;

    const total =
      records.length;

    const attendanceRate =
      total > 0
        ? Math.round(
            ((present + late) /
              total) *
              10000
          ) / 100
        : 0;

    return NextResponse.json({
      student: {
        id: student.id,
        studentNumber:
          student.studentNumber,
        firstName:
          student.firstName,
        lastName:
          student.lastName,
        className:
          student.class?.name ??
          "Unassigned",
      },

      summary: {
        total,
        present,
        absent,
        late,
        excused,
        attendanceRate,
      },

      records: records.map(
        (record) => ({
          id: record.id,
          date: record.date,
          status:
            record.status,
          remarks:
            record.remarks,
          className:
            record.class.name,
        })
      ),
    });
  } catch (error) {
    console.error(
      "GET /api/student/attendance:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load attendance",
      },
      { status: 500 }
    );
  }
}