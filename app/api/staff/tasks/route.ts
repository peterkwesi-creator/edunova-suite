import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  verifySession,
} from "@/lib/auth";

async function getStaffSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

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

  return session;
}

export async function GET() {
  try {
    const session = await getStaffSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const tasks = await prisma.staffTask.findMany({
      where: {
        schoolId: session.schoolId,
        userId: session.userId,
      },
      orderBy: [
        {
          completed: "asc",
        },
        {
          dueDate: "asc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error(
      "GET /api/staff/tasks error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to load tasks.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getStaffSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const title =
      typeof body.title === "string"
        ? body.title.trim()
        : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : null;

    const dueDate =
      typeof body.dueDate === "string" &&
      body.dueDate.trim() !== ""
        ? new Date(body.dueDate)
        : null;

    if (!title) {
      return NextResponse.json(
        {
          error: "Task title is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      dueDate &&
      Number.isNaN(dueDate.getTime())
    ) {
      return NextResponse.json(
        {
          error: "Invalid due date.",
        },
        {
          status: 400,
        }
      );
    }

    const task = await prisma.staffTask.create({
      data: {
        schoolId: session.schoolId,
        userId: session.userId,
        title,
        description: description || null,
        dueDate,
      },
    });

    return NextResponse.json(
      task,
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST /api/staff/tasks error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to create task.",
      },
      {
        status: 500,
      }
    );
  }
}