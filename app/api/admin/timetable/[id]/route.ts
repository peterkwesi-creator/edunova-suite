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
        {
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const { id } =
      await context.params;

    const entry =
      await prisma.timetableEntry.findFirst({
        where: {
          id,
          schoolId:
            session.schoolId,
        },
        select: {
          id: true,
        },
      });

    if (!entry) {
      return NextResponse.json(
        {
          error:
            "Timetable entry not found.",
        },
        { status: 404 }
      );
    }

    await prisma.timetableEntry.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "DELETE /api/admin/timetable/[id] error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to delete timetable entry",
      },
      { status: 500 }
    );
  }
}