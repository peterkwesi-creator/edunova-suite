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

  if (!user) return null;

  return {
    ...session,
    schoolId: user.schoolId,
    role: user.role,
  };
}

export async function POST(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
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

    const { id: academicYearId } =
      await context.params;

    const body =
      await request.json();

    const academicYear =
      await prisma.academicYear.findFirst({
        where: {
          id: academicYearId,
          schoolId: session.schoolId,
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

    const name = String(
      body.name || ""
    ).trim();

    const order = Number(
      body.order
    );

    const startDate = new Date(
      body.startDate
    );

    const endDate = new Date(
      body.endDate
    );

    if (
      !name ||
      !Number.isInteger(order) ||
      order < 1
    ) {
      return NextResponse.json(
        {
          error:
            "Term name and a positive order number are required.",
        },
        { status: 400 }
      );
    }

    if (
      Number.isNaN(
        startDate.getTime()
      ) ||
      Number.isNaN(
        endDate.getTime()
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid term dates.",
        },
        { status: 400 }
      );
    }

    if (endDate <= startDate) {
      return NextResponse.json(
        {
          error:
            "Term end date must be after start date.",
        },
        { status: 400 }
      );
    }

    if (
      startDate <
        academicYear.startDate ||
      endDate >
        academicYear.endDate
    ) {
      return NextResponse.json(
        {
          error:
            "Term dates must fall within the academic year dates.",
        },
        { status: 400 }
      );
    }

    const existing =
      await prisma.term.findFirst({
        where: {
          academicYearId,
          OR: [
            { name },
            { order },
          ],
        },
        select: {
          id: true,
        },
      });

    if (existing) {
      return NextResponse.json(
        {
          error:
            "A term with this name or order already exists.",
        },
        { status: 409 }
      );
    }

    const makeCurrent =
      body.isCurrent === true;

    if (
      body.isCurrent !== undefined &&
      typeof body.isCurrent !==
        "boolean"
    ) {
      return NextResponse.json(
        {
          error:
            "isCurrent must be a boolean.",
        },
        { status: 400 }
      );
    }

    const term =
      await prisma.$transaction(
        async (tx) => {
          if (makeCurrent) {
            await tx.term.updateMany({
              where: {
                academicYearId,
              },
              data: {
                isCurrent: false,
              },
            });
          }

          return tx.term.create({
            data: {
              name,
              order,
              startDate,
              endDate,
              isCurrent: makeCurrent,
              academicYearId,
            },
          });
        }
      );

    return NextResponse.json(
      term,
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/admin/academic-years/[id]/terms error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to create term",
      },
      { status: 500 }
    );
  }
}