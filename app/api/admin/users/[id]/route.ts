import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  verifySession,
  hashPassword,
} from "@/lib/auth";

const VALID_ROLES = [
  "ADMIN",
  "TEACHER",
  "STUDENT",
  "PARENT",
] as const;

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
      active: true,
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

async function getTargetUser(
  id: string,
  schoolId: string
) {
  return prisma.user.findFirst({
    where: {
      id,
      schoolId,
    },
  });
}

function canManageTarget(
  sessionRole: string,
  sessionUserId: string,
  target: {
    id: string;
    role: string;
  }
) {
  if (target.id === sessionUserId) {
    return false;
  }

  if (
    sessionRole === "ADMIN" &&
    target.role === "SUPER_ADMIN"
  ) {
    return false;
  }

  return true;
}

export async function GET(
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

    const user = await prisma.user.findFirst({
      where: {
        id,
        schoolId: session.schoolId,
      },
      include: {
        teacher: true,
        student: true,
        parent: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    if (
      session.role === "ADMIN" &&
      user.role === "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        { error: "Forbidden." },
        { status: 403 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error(
      "Admin user GET error:",
      error
    );

    return NextResponse.json(
      { error: "Failed to load user." },
      { status: 500 }
    );
  }
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

    const existingUser = await getTargetUser(
      id,
      session.schoolId
    );

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    if (
      !canManageTarget(
        session.role,
        session.userId,
        existingUser
      )
    ) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to manage this user.",
        },
        { status: 403 }
      );
    }

    if (
      existingUser.role === "SUPER_ADMIN" &&
      session.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        {
          error:
            "Only a SUPER_ADMIN can modify a SUPER_ADMIN account.",
        },
        { status: 403 }
      );
    }

    const data: {
      firstName?: string;
      lastName?: string;
      role?:
        | (typeof VALID_ROLES)[number];
      active?: boolean;
      passwordHash?: string;
    } = {};

    if (body.firstName !== undefined) {
      const firstName = String(
        body.firstName
      ).trim();

      if (!firstName) {
        return NextResponse.json(
          {
            error:
              "First name cannot be empty.",
          },
          { status: 400 }
        );
      }

      data.firstName = firstName;
    }

    if (body.lastName !== undefined) {
      const lastName = String(
        body.lastName
      ).trim();

      if (!lastName) {
        return NextResponse.json(
          {
            error:
              "Last name cannot be empty.",
          },
          { status: 400 }
        );
      }

      data.lastName = lastName;
    }

    if (body.role !== undefined) {
      if (!VALID_ROLES.includes(body.role)) {
        return NextResponse.json(
          { error: "Invalid user role." },
          { status: 400 }
        );
      }

      if (
        existingUser.role === "SUPER_ADMIN" &&
        body.role !== "ADMIN" &&
        body.role !== "SUPER_ADMIN"
      ) {
        return NextResponse.json(
          {
            error:
              "A SUPER_ADMIN account cannot be assigned this role.",
          },
          { status: 400 }
        );
      }

      if (
        session.role === "ADMIN" &&
        body.role === "ADMIN"
      ) {
        return NextResponse.json(
          {
            error:
              "Only a SUPER_ADMIN can create or assign an ADMIN role.",
          },
          { status: 403 }
        );
      }

      data.role = body.role;
    }

    if (body.active !== undefined) {
      if (
        id === session.userId &&
        body.active === false
      ) {
        return NextResponse.json(
          {
            error:
              "You cannot deactivate your own account.",
          },
          { status: 400 }
        );
      }

      data.active = Boolean(body.active);
    }

    if (body.password !== undefined) {
      const password = String(body.password);

      if (password.length < 6) {
        return NextResponse.json(
          {
            error:
              "Password must be at least 6 characters.",
          },
          { status: 400 }
        );
      }

      data.passwordHash =
        hashPassword(password);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        {
          error:
            "No valid changes were provided.",
        },
        { status: 400 }
      );
    }

    const updatedUser =
      await prisma.user.update({
        where: {
          id,
        },
        data,
        include: {
          teacher: {
            select: {
              id: true,
              employeeNumber: true,
              firstName: true,
              lastName: true,
              position: true,
            },
          },
          student: {
            select: {
              id: true,
              studentNumber: true,
              firstName: true,
              lastName: true,
            },
          },
          parent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

    return NextResponse.json({
      message: "User updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error(
      "Admin user PATCH error:",
      error
    );

    return NextResponse.json(
      { error: "Failed to update user." },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const existingUser = await getTargetUser(
      id,
      session.schoolId
    );

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    if (id === session.userId) {
      return NextResponse.json(
        {
          error:
            "You cannot delete your own account.",
        },
        { status: 400 }
      );
    }

    if (
      session.role === "ADMIN" &&
      existingUser.role === "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        {
          error:
            "Only a SUPER_ADMIN can delete a SUPER_ADMIN account.",
        },
        { status: 403 }
      );
    }

    await prisma.user.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      message:
        "User account deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Admin user DELETE error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to delete user account.",
      },
      { status: 500 }
    );
  }
}