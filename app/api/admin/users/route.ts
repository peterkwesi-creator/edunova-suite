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

export async function GET() {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const users = await prisma.user.findMany({
      where: {
        schoolId: session.schoolId,
      },
      include: {
        teacher: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
            gender: true,
            phone: true,
            position: true,
          },
        },
        student: {
          select: {
            id: true,
            studentNumber: true,
            firstName: true,
            lastName: true,
            gender: true,
          },
        },
        parent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Admin users GET error:", error);

    return NextResponse.json(
      { error: "Failed to load users" },
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

    const {
      email,
      password,
      firstName,
      lastName,
      role,
      teacherId,
      studentId,
      parentId,
    } = body;

    if (
      !email ||
      !password ||
      !firstName ||
      !lastName ||
      !role
    ) {
      return NextResponse.json(
        {
          error:
            "Email, password, first name, last name and role are required.",
        },
        { status: 400 }
      );
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: "Invalid user role." },
        { status: 400 }
      );
    }

    if (
      role === "ADMIN" &&
      session.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        {
          error:
            "Only a SUPER_ADMIN can create an ADMIN account.",
        },
        { status: 403 }
      );
    }

    if (String(password).length < 6) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 6 characters.",
        },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email)
      .trim()
      .toLowerCase();

    if (!normalizedEmail.includes("@")) {
      return NextResponse.json(
        {
          error:
            "Please provide a valid email address.",
        },
        { status: 400 }
      );
    }

    const cleanFirstName = String(firstName).trim();
    const cleanLastName = String(lastName).trim();

    if (!cleanFirstName || !cleanLastName) {
      return NextResponse.json(
        {
          error:
            "First name and last name cannot be empty.",
        },
        { status: 400 }
      );
    }

    const existingUser =
      await prisma.user.findUnique({
        where: {
          email: normalizedEmail,
        },
      });

    if (existingUser) {
      return NextResponse.json(
        {
          error:
            "A user with this email already exists.",
        },
        { status: 409 }
      );
    }

    if (teacherId) {
      const teacher =
        await prisma.teacher.findFirst({
          where: {
            id: String(teacherId),
            schoolId: session.schoolId,
          },
        });

      if (!teacher) {
        return NextResponse.json(
          { error: "Teacher not found." },
          { status: 404 }
        );
      }

      const linkedTeacher =
        await prisma.user.findFirst({
          where: {
            teacherId: String(teacherId),
          },
        });

      if (linkedTeacher) {
        return NextResponse.json(
          {
            error:
              "This teacher already has a user account.",
          },
          { status: 409 }
        );
      }

      if (role !== "TEACHER") {
        return NextResponse.json(
          {
            error:
              "A teacher profile can only be linked to a TEACHER account.",
          },
          { status: 400 }
        );
      }
    }

    if (studentId) {
      const student =
        await prisma.student.findFirst({
          where: {
            id: String(studentId),
            schoolId: session.schoolId,
          },
        });

      if (!student) {
        return NextResponse.json(
          { error: "Student not found." },
          { status: 404 }
        );
      }

      const linkedStudent =
        await prisma.user.findFirst({
          where: {
            studentId: String(studentId),
          },
        });

      if (linkedStudent) {
        return NextResponse.json(
          {
            error:
              "This student already has a user account.",
          },
          { status: 409 }
        );
      }

      if (role !== "STUDENT") {
        return NextResponse.json(
          {
            error:
              "A student profile can only be linked to a STUDENT account.",
          },
          { status: 400 }
        );
      }
    }

    if (parentId) {
      const parent =
        await prisma.parent.findFirst({
          where: {
            id: String(parentId),
            schoolId: session.schoolId,
          },
        });

      if (!parent) {
        return NextResponse.json(
          { error: "Parent not found." },
          { status: 404 }
        );
      }

      const linkedParent =
        await prisma.user.findFirst({
          where: {
            parentId: String(parentId),
          },
        });

      if (linkedParent) {
        return NextResponse.json(
          {
            error:
              "This parent already has a user account.",
          },
          { status: 409 }
        );
      }

      if (role !== "PARENT") {
        return NextResponse.json(
          {
            error:
              "A parent profile can only be linked to a PARENT account.",
          },
          { status: 400 }
        );
      }
    }

    const passwordHash = hashPassword(
      String(password)
    );

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        firstName: cleanFirstName,
        lastName: cleanLastName,
        role,
        schoolId: session.schoolId,
        active: true,
        teacherId: teacherId
          ? String(teacherId)
          : null,
        studentId: studentId
          ? String(studentId)
          : null,
        parentId: parentId
          ? String(parentId)
          : null,
      },
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

    return NextResponse.json(
      {
        message:
          "User account created successfully.",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Admin users POST error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to create user account.",
      },
      { status: 500 }
    );
  }
}