import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  verifySession,
} from "@/lib/auth";

async function getStaffSession() {
  const cookieStore = await cookies();

  const token =
    cookieStore.get(SESSION_COOKIE)?.value;

  const session = verifySession(token);

  if (!session) {
    return null;
  }

  if (
    session.role !== "ADMIN" &&
    session.role !== "SUPER_ADMIN" &&
    session.role !== "TEACHER"
  ) {
    return null;
  }

  const user = await prisma.user.findFirst({
    where: {
      id: session.userId,
      schoolId: session.schoolId,
      active: true,
      role: session.role,
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    return null;
  }

  return session;
}

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const session =
      await getStaffSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } =
      await context.params;

    const existingTask =
      await prisma.staffTask.findFirst({
        where: {
          id,
          schoolId: session.schoolId,
          userId: session.userId,
        },
      });

    if (!existingTask) {
      return NextResponse.json(
        {
          error: "Task not found.",
        },
        { status: 404 }
      );
    }

    const body = await request.json();

    const data: {
      title?: string;
      description?: string | null;
      dueDate?: Date | null;
      completed?: boolean;
    } = {};

    if (body.title !== undefined) {
      const title =
        typeof body.title === "string"
          ? body.title.trim()
          : "";

      if (!title) {
        return NextResponse.json(
          {
            error:
              "Task title is required.",
          },
          { status: 400 }
        );
      }

      data.title = title;
    }

    if (
      body.description !== undefined
    ) {
      data.description =
        typeof body.description ===
        "string"
          ? body.description.trim() ||
            null
          : null;
    }

    if (body.dueDate !== undefined) {
      if (
        body.dueDate === null ||
        body.dueDate === ""
      ) {
        data.dueDate = null;
      } else {
        const date =
          new Date(body.dueDate);

        if (
          Number.isNaN(date.getTime())
        ) {
          return NextResponse.json(
            {
              error:
                "Invalid due date.",
            },
            { status: 400 }
          );
        }

        data.dueDate = date;
      }
    }

    if (
      body.completed !== undefined
    ) {
      data.completed =
        Boolean(body.completed);
    }

    const task =
      await prisma.staffTask.update({
        where: {
          id: existingTask.id,
        },
        data,
      });

    return NextResponse.json(task);
  } catch (error) {
    console.error(
      "PATCH /api/staff/tasks/[id] error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to update task.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const session =
      await getStaffSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } =
      await context.params;

    const existingTask =
      await prisma.staffTask.findFirst({
        where: {
          id,
          schoolId: session.schoolId,
          userId: session.userId,
        },
        select: {
          id: true,
        },
      });

    if (!existingTask) {
      return NextResponse.json(
        {
          error: "Task not found.",
        },
        { status: 404 }
      );
    }

    await prisma.staffTask.delete({
      where: {
        id: existingTask.id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "DELETE /api/staff/tasks/[id] error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to delete task.",
      },
      { status: 500 }
    );
  }
}