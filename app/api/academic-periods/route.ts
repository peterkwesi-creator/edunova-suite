import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  verifySession,
} from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();

    const token =
      cookieStore.get(
        SESSION_COOKIE
      )?.value;

    const session =
      verifySession(token);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user =
      await prisma.user.findFirst({
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
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const academicYears =
      await prisma.academicYear.findMany({
        where: {
          schoolId: session.schoolId,
        },

        include: {
          terms: {
            orderBy: {
              order: "asc",
            },
          },
        },

        orderBy: {
          startDate: "desc",
        },
      });

    const currentYear =
      academicYears.find(
        (year) => year.isCurrent
      ) ??
      academicYears[0] ??
      null;

    const currentTerm =
      currentYear?.terms.find(
        (term) => term.isCurrent
      ) ??
      currentYear?.terms[0] ??
      null;

    return NextResponse.json({
      academicYears,
      currentYearId:
        currentYear?.id ?? null,
      currentTermId:
        currentTerm?.id ?? null,
    });
  } catch (error) {
    console.error(
      "Academic periods error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load academic periods",
      },
      { status: 500 }
    );
  }
}