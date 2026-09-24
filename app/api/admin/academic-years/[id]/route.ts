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
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();

    const academicYear =
      await prisma.academicYear.findFirst({
        where: {
          id,
          schoolId: session.schoolId,
        },
      });

    if (!academicYear) {
      return NextResponse.json(
        { error: "Academic year not found." },
        { status: 404 }
      );
    }

    const data: {
      name?: string;
      startDate?: Date;
      endDate?: Date;
      isCurrent?: boolean;
    } = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();

      if (!name) {
        return NextResponse.json(
          {
            error:
              "Academic year name is required.",
          },
          { status: 400 }
        );
      }

      const duplicate =
        await prisma.academicYear.findFirst({
          where: {
            schoolId: session.schoolId,
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
              "An academic year with this name already exists.",
          },
          { status: 409 }
        );
      }

      data.name = name;
    }

    if (body.startDate !== undefined) {
      const start = new Date(
        body.startDate
      );

      if (Number.isNaN(start.getTime())) {
        return NextResponse.json(
          { error: "Invalid start date." },
          { status: 400 }
        );
      }

      data.startDate = start;
    }

    if (body.endDate !== undefined) {
      const end = new Date(
        body.endDate
      );

      if (Number.isNaN(end.getTime())) {
        return NextResponse.json(
          { error: "Invalid end date." },
          { status: 400 }
        );
      }

      data.endDate = end;
    }

    const finalStart =
      data.startDate ??
      academicYear.startDate;

    const finalEnd =
      data.endDate ??
      academicYear.endDate;

    if (finalEnd <= finalStart) {
      return NextResponse.json(
        {
          error:
            "End date must be after start date.",
        },
        { status: 400 }
      );
    }

    if (body.isCurrent !== undefined) {
      if (
        typeof body.isCurrent !== "boolean"
      ) {
        return NextResponse.json(
          {
            error:
              "isCurrent must be a boolean.",
          },
          { status: 400 }
        );
      }

      if (body.isCurrent === true) {
        data.isCurrent = true;
      } else if (academicYear.isCurrent) {
        return NextResponse.json(
          {
            error:
              "The current academic year cannot be unset directly. Set another academic year as current first.",
          },
          { status: 400 }
        );
      } else {
        data.isCurrent = false;
      }
    }

    const updated =
      await prisma.$transaction(
        async (tx) => {
          if (data.isCurrent === true) {
            await tx.academicYear.updateMany({
              where: {
                schoolId:
                  session.schoolId,
                id: {
                  not: id,
                },
              },
              data: {
                isCurrent: false,
              },
            });

            await tx.term.updateMany({
              where: {
                academicYear: {
                  schoolId:
                    session.schoolId,
                },
              },
              data: {
                isCurrent: false,
              },
            });
          }

          return tx.academicYear.update({
            where: {
              id,
            },
            data,
            include: {
              terms: {
                orderBy: {
                  order: "asc",
                },
              },
            },
          });
        }
      );

    return NextResponse.json(updated);
  } catch (error) {
    console.error(
      "PATCH /api/admin/academic-years/[id] error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to update academic year",
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

    const { id } = await context.params;

    const academicYear =
      await prisma.academicYear.findFirst({
        where: {
          id,
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

    if (academicYear.isCurrent) {
      return NextResponse.json(
        {
          error:
            "The current academic year cannot be deleted. Set another academic year as current first.",
        },
        { status: 400 }
      );
    }

    await prisma.academicYear.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "DELETE /api/admin/academic-years/[id] error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to delete academic year",
      },
      { status: 500 }
    );
  }
}