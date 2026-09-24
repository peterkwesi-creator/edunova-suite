import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import {
  verifySession,
  SESSION_COOKIE,
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
    schoolId: user.schoolId,
    role: user.role,
  };
}

export async function GET() {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const fees = await prisma.fee.findMany({
      where: {
        schoolId: session.schoolId,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentNumber: true,
            class: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            reference: true,
            method: true,
            status: true,
            paidAt: true,
          },
          orderBy: {
            paidAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(fees);
  } catch (error) {
    console.error(
      "ADMIN FEES GET ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Failed to load fees." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      title,
      description,
      amount,
      academicYear,
      term,
      studentId,
      classId,
      dueDate,
    } = body;

    if (
      !title ||
      !academicYear ||
      !term ||
      !studentId ||
      amount === undefined ||
      amount === null
    ) {
      return NextResponse.json(
        {
          error:
            "Title, amount, academic year, term and student are required.",
        },
        { status: 400 }
      );
    }

    const cleanTitle = String(title).trim();
    const cleanAcademicYear =
      String(academicYear).trim();
    const cleanTerm = String(term).trim();

    if (!cleanTitle) {
      return NextResponse.json(
        { error: "Fee title cannot be empty." },
        { status: 400 }
      );
    }

    if (!cleanAcademicYear || !cleanTerm) {
      return NextResponse.json(
        {
          error:
            "Academic year and term cannot be empty.",
        },
        { status: 400 }
      );
    }

    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Amount must be greater than zero.",
        },
        { status: 400 }
      );
    }

    const student =
      await prisma.student.findFirst({
        where: {
          id: String(studentId),
          schoolId: session.schoolId,
        },
        select: {
          id: true,
          classId: true,
        },
      });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found." },
        { status: 404 }
      );
    }

    let verifiedClassId:
      | string
      | null = null;

    if (classId) {
      const schoolClass =
        await prisma.schoolClass.findFirst({
          where: {
            id: String(classId),
            schoolId: session.schoolId,
          },
          select: {
            id: true,
          },
        });

      if (!schoolClass) {
        return NextResponse.json(
          { error: "Class not found." },
          { status: 404 }
        );
      }

      if (
        student.classId &&
        student.classId !== schoolClass.id
      ) {
        return NextResponse.json(
          {
            error:
              "The selected class does not match the student's current class.",
          },
          { status: 400 }
        );
      }

      verifiedClassId = schoolClass.id;
    } else if (student.classId) {
      verifiedClassId = student.classId;
    }

    let verifiedDueDate:
      | Date
      | null = null;

    if (dueDate) {
      const parsedDueDate = new Date(
        String(dueDate)
      );

      if (
        Number.isNaN(
          parsedDueDate.getTime()
        )
      ) {
        return NextResponse.json(
          { error: "Invalid due date." },
          { status: 400 }
        );
      }

      verifiedDueDate = parsedDueDate;
    }

    const fee = await prisma.fee.create({
      data: {
        title: cleanTitle,
        description: description
          ? String(description).trim()
          : null,
        amount: numericAmount,
        academicYear: cleanAcademicYear,
        term: cleanTerm,
        studentId: student.id,
        schoolId: session.schoolId,
        classId: verifiedClassId,
        dueDate: verifiedDueDate,
        status: "UNPAID",
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentNumber: true,
          },
        },
        payments: true,
      },
    });

    return NextResponse.json(
      fee,
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "ADMIN FEES POST ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Failed to create fee." },
      { status: 500 }
    );
  }
}