import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  verifySession,
  SESSION_COOKIE,
} from "@/lib/auth";

async function getParentFromSession() {
  const cookieStore = await cookies();

  const token =
    cookieStore.get(SESSION_COOKIE)?.value;

  const session = verifySession(token);

  if (!session || session.role !== "PARENT") {
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
      schoolId: true,
      parentId: true,
    },
  });

  if (!user || !user.parentId) {
    return null;
  }

  const parent = await prisma.parent.findFirst({
    where: {
      id: user.parentId,
      schoolId: user.schoolId,
    },
  });

  if (!parent) {
    return null;
  }

  return {
    user,
    parent,
  };
}

export async function GET() {
  try {
    const auth = await getParentFromSession();

    if (!auth) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    const children =
      await prisma.parentStudent.findMany({
        where: {
          parentId: auth.parent.id,
          student: {
            schoolId: auth.user.schoolId,
          },
        },
        include: {
          student: {
            include: {
              class: {
                select: {
                  id: true,
                  name: true,
                },
              },
              attendance: {
                orderBy: {
                  date: "desc",
                },
                select: {
                  id: true,
                  date: true,
                  status: true,
                  remarks: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });

    return NextResponse.json({
      parent: {
        firstName: auth.parent.firstName,
        lastName: auth.parent.lastName,
      },

      children: children.map((ward) => {
        const attendance =
          ward.student.attendance;

        const totalDays =
          attendance.length;

        const presentDays =
          attendance.filter(
            (record) =>
              record.status.toUpperCase() ===
              "PRESENT"
          ).length;

        const absentDays =
          attendance.filter(
            (record) =>
              record.status.toUpperCase() ===
              "ABSENT"
          ).length;

        const lateDays =
          attendance.filter(
            (record) =>
              record.status.toUpperCase() ===
              "LATE"
          ).length;

        const excusedDays =
          attendance.filter(
            (record) =>
              record.status.toUpperCase() ===
              "EXCUSED"
          ).length;

        const attendancePercentage =
          totalDays > 0
            ? (presentDays / totalDays) * 100
            : 0;

        return {
          id: ward.student.id,
          studentNumber:
            ward.student.studentNumber,
          firstName:
            ward.student.firstName,
          lastName:
            ward.student.lastName,
          relationship:
            ward.relationship,

          class: ward.student.class
            ? {
                id: ward.student.class.id,
                name: ward.student.class.name,
              }
            : null,

          summary: {
            totalDays,
            presentDays,
            absentDays,
            lateDays,
            excusedDays,
            attendancePercentage,
          },

          attendance:
            attendance.map((record) => ({
              id: record.id,
              date: record.date,
              status: record.status,
              remarks: record.remarks,
            })),
        };
      }),
    });
  } catch (error) {
    console.error(
      "PARENT ATTENDANCE GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load parent attendance.",
      },
      {
        status: 500,
      }
    );
  }
}