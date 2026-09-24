import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  verifySession,
} from "@/lib/auth";

const ALLOWED_STATUSES = [
  "NEW",
  "READ",
  "RESOLVED",
];

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
    role: user.role,
    schoolId: user.schoolId,
  };
}

export async function GET() {
  try {
    const session =
      await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const messages =
      await prisma.contactMessage.findMany({
        where: {
          schoolId: session.schoolId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json(messages);
  } catch (error) {
    console.error(
      "Contact messages GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load contact messages.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest
) {
  try {
    const session =
      await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const id = String(
      body.id || ""
    ).trim();

    const status = String(
      body.status || ""
    )
      .trim()
      .toUpperCase();

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Message ID is required.",
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          error:
            "Invalid message status.",
        },
        { status: 400 }
      );
    }

    const existing =
      await prisma.contactMessage.findFirst({
        where: {
          id,
          schoolId:
            session.schoolId,
        },
        select: {
          id: true,
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          error:
            "Message not found.",
        },
        { status: 404 }
      );
    }

    const updated =
      await prisma.contactMessage.update({
        where: {
          id,
        },
        data: {
          status,
        },
      });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(
      "Contact messages PATCH error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to update message.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest
) {
  try {
    const session =
      await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const id = String(
      body.id || ""
    ).trim();

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Message ID is required.",
        },
        { status: 400 }
      );
    }

    const existing =
      await prisma.contactMessage.findFirst({
        where: {
          id,
          schoolId:
            session.schoolId,
        },
        select: {
          id: true,
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          error:
            "Message not found.",
        },
        { status: 404 }
      );
    }

    await prisma.contactMessage.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Message deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Contact messages DELETE error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to delete message.",
      },
      { status: 500 }
    );
  }
}