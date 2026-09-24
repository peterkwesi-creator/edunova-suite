import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    const session = verifySession(token);

    if (!session) {
      return NextResponse.json(
        { error: "You are not logged in." },
        { status: 401 }
      );
    }

    if (session.role !== "TEACHER") {
      return NextResponse.json(
        { error: "This account is not a teacher account." },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.userId,
      },
      select: {
        id: true,
        email: true,
        schoolId: true,
        teacherId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User account not found." },
        { status: 404 }
      );
    }

    if (user.teacherId) {
      return NextResponse.json({
        success: true,
        message: "Your account is already linked to a teacher profile.",
        teacherId: user.teacherId,
      });
    }

    if (!user.email || !user.schoolId) {
      return NextResponse.json(
        {
          error:
            "Your account does not have the information needed to find the teacher profile.",
        },
        { status: 400 }
      );
    }

    const teacher = await prisma.teacher.findFirst({
      where: {
        email: user.email,
        schoolId: user.schoolId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    if (!teacher) {
      return NextResponse.json(
        {
          error:
            "No teacher profile was found with the same email address. Make sure the Teacher profile uses the same email as your login account.",
        },
        { status: 404 }
      );
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        teacherId: teacher.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Teacher account linked successfully.",
      teacher: {
        id: teacher.id,
        name: `${teacher.firstName} ${teacher.lastName}`,
        email: teacher.email,
      },
    });
  } catch (error) {
    console.error("LINK TEACHER PROFILE ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to link teacher profile.",
      },
      { status: 500 }
    );
  }
}