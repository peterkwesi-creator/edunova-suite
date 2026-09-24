import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  verifySession,
  SESSION_COOKIE,
} from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();

    const token =
      cookieStore.get(SESSION_COOKIE)?.value;

    const session = verifySession(token);

    if (!session || session.role !== "PARENT") {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    // Find the active parent account and ensure
    // the user's current school matches the session.
    const user = await prisma.user.findFirst({
      where: {
        id: session.userId,
        schoolId: session.schoolId,
        active: true,
      },
      select: {
        id: true,
        email: true,
        schoolId: true,
        parentId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "User account not found.",
        },
        {
          status: 401,
        }
      );
    }

    // Resolve parent profile.
    let parent = null;

    if (user.parentId) {
      parent =
        await prisma.parent.findFirst({
          where: {
            id: user.parentId,
            schoolId: user.schoolId,
          },
        });
    }

    // Auto-link parent account by email if necessary.
    if (!parent && user.email) {
      parent =
        await prisma.parent.findFirst({
          where: {
            email: user.email,
            schoolId: user.schoolId,
          },
        });

      if (parent) {
        await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            parentId: parent.id,
          },
        });
      }
    }

    if (!parent) {
      return NextResponse.json(
        {
          error:
            "Parent profile not found.",
        },
        {
          status: 404,
        }
      );
    }

    // Get only children linked to this parent.
    const parentStudents =
      await prisma.parentStudent.findMany({
        where: {
          parentId: parent.id,
          student: {
            schoolId: user.schoolId,
          },
        },
        select: {
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
        },
        orderBy: {
          student: {
            firstName: "asc",
          },
        },
      });

    const children =
      parentStudents.map(
        (item) => item.student
      );

    const studentIds =
      children.map(
        (child) => child.id
      );

    // No children = no fees.
    if (studentIds.length === 0) {
      return NextResponse.json({
        children,
        fees: [],
      });
    }

    // Retrieve fees only for this parent's
    // verified children in the authenticated school.
    const fees =
      await prisma.fee.findMany({
        where: {
          schoolId: user.schoolId,
          studentId: {
            in: studentIds,
          },
        },
        select: {
          id: true,
          title: true,
          description: true,
          amount: true,
          academicYear: true,
          term: true,
          dueDate: true,
          status: true,

          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              studentNumber: true,
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
        orderBy: [
          {
            dueDate: "asc",
          },
          {
            createdAt: "desc",
          },
        ],
      });

    return NextResponse.json({
      children,
      fees,
    });
  } catch (error) {
    console.error(
      "PARENT FEES ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load parent fees.",
      },
      {
        status: 500,
      }
    );
  }
}