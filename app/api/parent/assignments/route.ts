import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

async function getParentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = verifySession(token);

  if (!session || session.role !== "PARENT") {
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
      parentId: true,
      email: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    user,
    session,
  };
}

export async function GET(request: Request) {
  try {
    const auth = await getParentSession();

    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const requestedStudentId = searchParams.get("studentId");

    const parent = await prisma.parent.findFirst({
      where: {
        OR: [
          ...(auth.user.parentId
            ? [
                {
                  id: auth.user.parentId,
                  schoolId: auth.user.schoolId,
                },
              ]
            : []),
          {
            email: auth.user.email,
            schoolId: auth.user.schoolId,
          },
        ],
      },
      include: {
        children: {
          include: {
            student: {
              include: {
                class: true,
              },
            },
          },
        },
      },
    });

    if (!parent) {
      return NextResponse.json(
        { error: "Parent profile not found." },
        { status: 404 }
      );
    }

    const children = parent.children
      .map((relationship) => relationship.student)
      .filter(
        (student) => student.schoolId === auth.user.schoolId
      );

    if (children.length === 0) {
      return NextResponse.json({
        children: [],
        assignments: [],
      });
    }

    let selectedChildren = children;

    if (requestedStudentId) {
      const requestedChild = children.find(
        (child) => child.id === requestedStudentId
      );

      if (requestedChild) {
        selectedChildren = [requestedChild];
      }
    }

    const selectedChildIds = selectedChildren.map(
      (child) => child.id
    );

    const selectedClassIds = [
      ...new Set(
        selectedChildren
          .map((child) => child.classId)
          .filter((id): id is string => Boolean(id))
      ),
    ];

    if (selectedClassIds.length === 0) {
      return NextResponse.json({
        children: selectedChildren.map((child) => ({
          id: child.id,
          firstName: child.firstName,
          lastName: child.lastName,
          studentNumber: child.studentNumber,
          class: child.class
            ? {
                id: child.class.id,
                name: child.class.name,
              }
            : null,
        })),
        assignments: selectedChildren.map((child) => ({
          student: {
            id: child.id,
            firstName: child.firstName,
            lastName: child.lastName,
            studentNumber: child.studentNumber,
            class: child.class
              ? {
                  id: child.class.id,
                  name: child.class.name,
                }
              : null,
          },
          assignments: [],
        })),
      });
    }

    const assignments = await prisma.assignment.findMany({
      where: {
        classId: {
          in: selectedClassIds,
        },
        class: {
          schoolId: auth.user.schoolId,
        },
        subject: {
          schoolId: auth.user.schoolId,
        },
        teacher: {
          schoolId: auth.user.schoolId,
        },
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        submissions: {
          where: {
            studentId: {
              in: selectedChildIds,
            },
          },
          select: {
            id: true,
            studentId: true,
            answer: true,
            submittedAt: true,
            grade: true,
            feedback: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const result = selectedChildren.map((child) => {
      const childAssignments = assignments
        .filter(
          (assignment) =>
            assignment.class.id === child.classId
        )
        .map((assignment) => {
          const submission = assignment.submissions.find(
            (item) => item.studentId === child.id
          );

          return {
            id: assignment.id,
            title: assignment.title,
            description: assignment.description,
            dueDate: assignment.dueDate,
            createdAt: assignment.createdAt,

            child: {
              id: child.id,
              firstName: child.firstName,
              lastName: child.lastName,
              studentNumber: child.studentNumber,
              class: child.class
                ? {
                    id: child.class.id,
                    name: child.class.name,
                  }
                : null,
            },

            class: {
              id: assignment.class.id,
              name: assignment.class.name,
            },

            subject: {
              id: assignment.subject.id,
              name: assignment.subject.name,
              code: assignment.subject.code,
            },

            teacher: {
              id: assignment.teacher.id,
              firstName: assignment.teacher.firstName,
              lastName: assignment.teacher.lastName,
              name: `${assignment.teacher.firstName} ${assignment.teacher.lastName}`,
            },

            submission: submission
              ? {
                  id: submission.id,
                  answer: submission.answer,
                  submittedAt: submission.submittedAt,
                  grade: submission.grade,
                  feedback: submission.feedback,
                  status: submission.status,
                }
              : null,
          };
        });

      return {
        student: {
          id: child.id,
          firstName: child.firstName,
          lastName: child.lastName,
          studentNumber: child.studentNumber,
          class: child.class
            ? {
                id: child.class.id,
                name: child.class.name,
              }
            : null,
        },
        assignments: childAssignments,
      };
    });

    return NextResponse.json({
      children: selectedChildren.map((child) => ({
        id: child.id,
        firstName: child.firstName,
        lastName: child.lastName,
        studentNumber: child.studentNumber,
        class: child.class
          ? {
              id: child.class.id,
              name: child.class.name,
            }
          : null,
      })),
      assignments: result,
    });
  } catch (error) {
    console.error("Parent assignments GET error:", error);

    return NextResponse.json(
      {
        error: "Failed to load parent assignments.",
      },
      { status: 500 }
    );
  }
}