import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  verifySession,
  SESSION_COOKIE,
} from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isAdmin(role: string) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

async function getAdminSession() {
  const cookieStore = await cookies();

  const token = cookieStore.get(
    SESSION_COOKIE
  )?.value;

  const session = verifySession(token);

  if (!session) {
    return null;
  }

  if (!isAdmin(session.role)) {
    return null;
  }

  return session;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized or forbidden." },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Teacher ID is required." },
        { status: 400 }
      );
    }

    const teacher = await prisma.teacher.findFirst({
      where: {
        id,
        schoolId: session.schoolId,
      },
      select: {
        id: true,
        employeeNumber: true,
        firstName: true,
        lastName: true,
        gender: true,
        photoUrl: true,
        phone: true,
        email: true,
        address: true,
        qualification: true,
        specialization: true,
        position: true,
        schoolId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Teacher not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(teacher);
  } catch (error) {
    console.error("GET TEACHER ERROR:", error);

    return NextResponse.json(
      { error: "Failed to load teacher." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized or forbidden." },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Teacher ID is required." },
        { status: 400 }
      );
    }

    const body = await request.json();

    const employeeNumber =
      typeof body.employeeNumber === "string"
        ? body.employeeNumber.trim()
        : "";

    const firstName =
      typeof body.firstName === "string"
        ? body.firstName.trim()
        : "";

    const lastName =
      typeof body.lastName === "string"
        ? body.lastName.trim()
        : "";

    const gender =
      typeof body.gender === "string"
        ? body.gender.trim()
        : "";

    const photoUrl =
      typeof body.photoUrl === "string"
        ? body.photoUrl.trim() || null
        : null;

    const phone =
      typeof body.phone === "string"
        ? body.phone.trim()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase() || null
        : null;

    const address =
      typeof body.address === "string"
        ? body.address.trim() || null
        : null;

    const qualification =
      typeof body.qualification === "string"
        ? body.qualification.trim() || null
        : null;

    const specialization =
      typeof body.specialization === "string"
        ? body.specialization.trim() || null
        : null;

    const position =
      typeof body.position === "string"
        ? body.position.trim() || null
        : null;

    if (
      !employeeNumber ||
      !firstName ||
      !lastName ||
      !gender ||
      !phone
    ) {
      return NextResponse.json(
        {
          error:
            "Employee number, first name, last name, gender and phone are required.",
        },
        { status: 400 }
      );
    }

    if (
      photoUrl &&
      !photoUrl.startsWith(
        "/uploads/teachers/"
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid teacher photo URL.",
        },
        { status: 400 }
      );
    }

    if (
      email &&
      !email.includes("@")
    ) {
      return NextResponse.json(
        {
          error:
            "Please provide a valid email address.",
        },
        { status: 400 }
      );
    }

    const existingTeacher =
      await prisma.teacher.findFirst({
        where: {
          id,
          schoolId: session.schoolId,
        },
      });

    if (!existingTeacher) {
      return NextResponse.json(
        { error: "Teacher not found." },
        { status: 404 }
      );
    }

    const duplicateEmployeeNumber =
      await prisma.teacher.findFirst({
        where: {
          employeeNumber,
          schoolId: session.schoolId,
          NOT: {
            id,
          },
        },
      });

    if (duplicateEmployeeNumber) {
      return NextResponse.json(
        {
          error:
            "Another teacher already uses this employee number.",
        },
        { status: 409 }
      );
    }

    const updatedTeacher =
      await prisma.teacher.update({
        where: {
          id,
        },
        data: {
          employeeNumber,
          firstName,
          lastName,
          gender,
          photoUrl,
          phone,
          email,
          address,
          qualification,
          specialization,
          position,
        },
        select: {
          id: true,
          employeeNumber: true,
          firstName: true,
          lastName: true,
          gender: true,
          photoUrl: true,
          phone: true,
          email: true,
          address: true,
          qualification: true,
          specialization: true,
          position: true,
          schoolId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    return NextResponse.json({
      message: "Teacher updated successfully.",
      teacher: updatedTeacher,
    });
  } catch (error) {
    console.error("UPDATE TEACHER ERROR:", error);

    return NextResponse.json(
      { error: "Failed to update teacher." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized or forbidden." },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Teacher ID is required." },
        { status: 400 }
      );
    }

    const teacher = await prisma.teacher.findFirst({
      where: {
        id,
        schoolId: session.schoolId,
      },
      select: {
        id: true,
        employeeNumber: true,
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Teacher not found." },
        { status: 404 }
      );
    }

    await prisma.teacher.delete({
      where: {
        id: teacher.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Teacher deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE TEACHER ERROR:", error);

    return NextResponse.json(
      { error: "Failed to delete teacher." },
      { status: 500 }
    );
  }
}