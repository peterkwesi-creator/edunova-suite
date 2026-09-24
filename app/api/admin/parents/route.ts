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

export async function GET() {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const parents = await prisma.parent.findMany({
      where: {
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
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        firstName: "asc",
      },
    });

    return NextResponse.json(parents);
  } catch (error) {
    console.error(
      "Admin parents GET error:",
      error
    );

    return NextResponse.json(
      { error: "Failed to load parents." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
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

    const parent = await prisma.parent.create({
      data: {
        firstName,
        lastName,
        phone: phone || null,
        email,
        address: address || null,
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
      },
    });

    return NextResponse.json(
      {
        message: "Parent created successfully.",
        parent,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Admin parents POST error:",
      error
    );

    return NextResponse.json(
      { error: "Failed to create parent." },
      { status: 500 }
    );
  }
}