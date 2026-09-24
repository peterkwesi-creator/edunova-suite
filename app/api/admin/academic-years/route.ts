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
    schoolId: user.schoolId,
    role: user.role,
  };
}

export async function GET() {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const academicYears =
      await prisma.academicYear.findMany({
        where: {
          schoolId: session.schoolId,
        },
        include: {
          terms: {
            orderBy: {
              order: "asc",
            },
          },
        },
        orderBy: {
          startDate: "desc",
        },
      });

    return NextResponse.json(
      academicYears
    );
  } catch (error) {
    console.error(
      "GET /api/admin/academic-years error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load academic years",
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

    const name = String(
      body.name || ""
    ).trim();

    const startDate = String(
      body.startDate || ""
    );

    const endDate = String(
      body.endDate || ""
    );

    if (
      !name ||
      !startDate ||
      !endDate
    ) {
      return NextResponse.json(
        {
          error:
            "Academic year name, start date and end date are required.",
        },
        { status: 400 }
      );
    }

    const start = new Date(
      startDate
    );

    const end = new Date(
      endDate
    );

    if (
      Number.isNaN(
        start.getTime()
      ) ||
      Number.isNaN(
        end.getTime()
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid academic year dates.",
        },
        { status: 400 }
      );
    }

    if (end <= start) {
      return NextResponse.json(
        {
          error:
            "End date must be after start date.",
        },
        { status: 400 }
      );
    }

    const existing =
      await prisma.academicYear.findUnique(
        {
          where: {
            schoolId_name: {
              schoolId:
                session.schoolId,
              name,
            },
          },
        }
      );

    if (existing) {
      return NextResponse.json(
        {
          error:
            "This academic year already exists.",
        },
        { status: 409 }
      );
    }

    const academicYear =
      await prisma.$transaction(
        async (tx) => {
          await tx.academicYear.updateMany(
            {
              where: {
                schoolId:
                  session.schoolId,
              },
              data: {
                isCurrent: false,
              },
            }
          );

          return tx.academicYear.create({
            data: {
              name,
              startDate: start,
              endDate: end,
              isCurrent: true,
              schoolId:
                session.schoolId,
            },
            include: {
              terms: true,
            },
          });
        }
      );

    return NextResponse.json(
      academicYear,
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/admin/academic-years error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to create academic year",
      },
      { status: 500 }
    );
  }
}