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

export async function PATCH(
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

    const { id } =
      await context.params;

    const body =
      await request.json();

    const term =
      await prisma.term.findFirst({
        where: {
          id,
          academicYear: {
            schoolId:
              session.schoolId,
          },
        },
        include: {
          academicYear: true,
        },
      });

    if (!term) {
      return NextResponse.json(
        {
          error: "Term not found.",
        },
        { status: 404 }
      );
    }

    const data: {
      name?: string;
      order?: number;
      startDate?: Date;
      endDate?: Date;
      isCurrent?: boolean;
    } = {};

    if (body.name !== undefined) {
      const name = String(
        body.name
      ).trim();

      if (!name) {
        return NextResponse.json(
          {
            error:
              "Term name is required.",
          },
          { status: 400 }
        );
      }

      const duplicate =
        await prisma.term.findFirst({
          where: {
            academicYearId:
              term.academicYearId,
            name,
            id: {
              not: id,
            },
          },
          select: {
            id: true,
          },
        });

      if (duplicate) {
        return NextResponse.json(
          {
            error:
              "A term with this name already exists in this academic year.",
          },
          { status: 409 }
        );
      }

      data.name = name;
    }

    if (body.order !== undefined) {
      const order = Number(
        body.order
      );

      if (
        !Number.isInteger(order) ||
        order < 1
      ) {
        return NextResponse.json(
          {
            error:
              "Term order must be a positive whole number.",
          },
          { status: 400 }
        );
      }

      const duplicate =
        await prisma.term.findFirst({
          where: {
            academicYearId:
              term.academicYearId,
            order,
            id: {
              not: id,
            },
          },
          select: {
            id: true,
          },
        });

      if (duplicate) {
        return NextResponse.json(
          {
            error:
              "A term with this order already exists in this academic year.",
          },
          { status: 409 }
        );
      }

      data.order = order;
    }

    if (
      body.startDate !== undefined
    ) {
      const date = new Date(
        body.startDate
      );

      if (Number.isNaN(date.getTime())) {
        return NextResponse.json(
          {
            error:
              "Invalid start date.",
          },
          { status: 400 }
        );
      }

      data.startDate = date;
    }

    if (
      body.endDate !== undefined
    ) {
      const date = new Date(
        body.endDate
      );

      if (Number.isNaN(date.getTime())) {
        return NextResponse.json(
          {
            error:
              "Invalid end date.",
          },
          { status: 400 }
        );
      }

      data.endDate = date;
    }

    const finalStart =
      data.startDate ??
      term.startDate;

    const finalEnd =
      data.endDate ??
      term.endDate;

    if (finalEnd <= finalStart) {
      return NextResponse.json(
        {
          error:
            "Term end date must be after start date.",
        },
        { status: 400 }
      );
    }

    if (
      finalStart <
        term.academicYear.startDate ||
      finalEnd >
        term.academicYear.endDate
    ) {
      return NextResponse.json(
        {
          error:
            "Term dates must remain inside the academic year dates.",
        },
        { status: 400 }
      );
    }

    if (
      body.isCurrent !== undefined
    ) {
      if (
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

      if (
        body.isCurrent === false &&
        term.isCurrent
      ) {
        return NextResponse.json(
          {
            error:
              "The current term cannot be unset directly. Set another term as current first.",
          },
          { status: 400 }
        );
      }

      data.isCurrent =
        body.isCurrent;
    }

    const updated =
      await prisma.$transaction(
        async (tx) => {
          if (
            data.isCurrent === true
          ) {
            await tx.term.updateMany({
              where: {
                academicYearId:
                  term.academicYearId,
                id: {
                  not: id,
                },
              },
              data: {
                isCurrent: false,
              },
            });
          }

          return tx.term.update({
            where: {
              id,
            },
            data,
          });
        }
      );

    return NextResponse.json(
      updated
    );
  } catch (error) {
    console.error(
      "PATCH /api/admin/terms/[id] error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to update term",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
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

    const { id } =
      await context.params;

    const term =
      await prisma.term.findFirst({
        where: {
          id,
          academicYear: {
            schoolId:
              session.schoolId,
          },
        },
      });

    if (!term) {
      return NextResponse.json(
        {
          error: "Term not found.",
        },
        { status: 404 }
      );
    }

    if (term.isCurrent) {
      return NextResponse.json(
        {
          error:
            "The current term cannot be deleted. Set another term as current first.",
        },
        { status: 400 }
      );
    }

    await prisma.term.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "DELETE /api/admin/terms/[id] error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to delete term",
      },
      { status: 500 }
    );
  }
}