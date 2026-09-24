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
    role: user.role,
    schoolId: user.schoolId,
  };
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

    const parent = await prisma.parent.findFirst({
      where: {
        id,
        schoolId: session.schoolId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        address: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            active: true,
          },
        },
        children: {
          select: {
            id: true,
            relationship: true,
            isPrimary: true,
            student: {
              select: {
                id: true,
                studentNumber: true,
                firstName: true,
                lastName: true,
                class: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!parent) {
      return NextResponse.json(
        { error: "Parent not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(parent);
  } catch (error) {
    console.error(
      "Admin parent GET error:",
      error
    );

    return NextResponse.json(
      { error: "Failed to load parent." },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const existingParent =
      await prisma.parent.findFirst({
        where: {
          id,
          schoolId: session.schoolId,
        },
        include: {
          user: {
            select: {
              id: true,
            },
          },
        },
      });

    if (!existingParent) {
      return NextResponse.json(
        { error: "Parent not found." },
        { status: 404 }
      );
    }

    const body = await request.json();

    const firstName = String(
      body.firstName ?? ""
    ).trim();

    const lastName = String(
      body.lastName ?? ""
    ).trim();

    const phone = String(
      body.phone ?? ""
    ).trim();

    const emailValue = String(
      body.email ?? ""
    ).trim();

    const address = String(
      body.address ?? ""
    ).trim();

    if (!firstName || !lastName) {
      return NextResponse.json(
        {
          error:
            "First name and last name are required.",
        },
        { status: 400 }
      );
    }

    let email: string | null = null;

    if (emailValue) {
      email = emailValue.toLowerCase();

      if (!email.includes("@")) {
        return NextResponse.json(
          {
            error:
              "Please provide a valid email address.",
          },
          { status: 400 }
        );
      }
    }

    const parent = await prisma.parent.update({
      where: {
        id,
      },
      data: {
        firstName,
        lastName,
        phone: phone || null,
        email,
        address: address || null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        address: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            active: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Parent updated successfully.",
      parent,
    });
  } catch (error) {
    console.error(
      "Admin parent PUT error:",
      error
    );

    return NextResponse.json(
      { error: "Failed to update parent." },
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

    const parent = await prisma.parent.findFirst({
      where: {
        id,
        schoolId: session.schoolId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        user: {
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            children: true,
          },
        },
      },
    });

    if (!parent) {
      return NextResponse.json(
        { error: "Parent not found." },
        { status: 404 }
      );
    }

    if (parent._count.children > 0) {
      return NextResponse.json(
        {
          error:
            "This parent cannot be deleted while they are linked to students. Remove the child links first.",
        },
        { status: 409 }
      );
    }

    await prisma.parent.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      message: "Parent profile deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Admin parent DELETE error:",
      error
    );

    return NextResponse.json(
      { error: "Failed to delete parent." },
      { status: 500 }
    );
  }
}