import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get(SESSION_COOKIE)?.value;

    const session = verifySession(token);

    if (!session || session.role !== "PARENT") {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        id: session.userId,
        schoolId: session.schoolId,
        active: true,
        role: "PARENT",
      },
      include: {
        parent: {
          include: {
            children: {
              where: {
                student: {
                  schoolId: session.schoolId,
                },
              },
              include: {
                student: {
                  include: {
                    class: true,

                    results: {
                      where: {
                        student: {
                          schoolId: session.schoolId,
                        },
                      },
                      include: {
                        subject: true,
                        teacher: true,
                      },
                      orderBy: {
                        updatedAt: "desc",
                      },
                    },

                    submissions: {
                      where: {
                        student: {
                          schoolId: session.schoolId,
                        },
                        assignment: {
                          class: {
                            schoolId: session.schoolId,
                          },
                        },
                      },
                      include: {
                        assignment: {
                          include: {
                            subject: true,
                            class: true,
                            teacher: true,
                          },
                        },
                      },
                      orderBy: {
                        submittedAt: "desc",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.parent) {
      return NextResponse.json(
        {
          error: "Parent profile not found",
        },
        {
          status: 404,
        }
      );
    }

    if (user.parent.schoolId !== session.schoolId) {
      return NextResponse.json(
        {
          error: "Invalid parent school access",
        },
        {
          status: 403,
        }
      );
    }

    const parent = user.parent;

    return NextResponse.json({
      parent: {
        id: parent.id,
        firstName: parent.firstName,
        lastName: parent.lastName,
        email: parent.email || user.email,
        phone: parent.phone,
        address: parent.address,
      },

      children: parent.children.map((item) => ({
        relationship: item.relationship,
        isPrimary: item.isPrimary,

        student: {
          id: item.student.id,
          studentNumber: item.student.studentNumber,
          firstName: item.student.firstName,
          lastName: item.student.lastName,
          gender: item.student.gender,

          class: item.student.class
            ? {
                id: item.student.class.id,
                name: item.student.class.name,
              }
            : null,

          results: item.student.results.map((result) => ({
            id: result.id,

            subject: {
              id: result.subject.id,
              name: result.subject.name,
              code: result.subject.code,
            },

            assessmentScore: result.assessmentScore,
            examScore: result.examScore,
            totalScore: result.totalScore,
            grade: result.grade,
            remark: result.remark,

            teacher: result.teacher
              ? {
                  firstName: result.teacher.firstName,
                  lastName: result.teacher.lastName,
                }
              : null,
          })),

          submissions: item.student.submissions.map(
            (submission) => ({
              id: submission.id,
              answer: submission.answer,
              status: submission.status,
              grade: submission.grade,
              feedback: submission.feedback,
              submittedAt: submission.submittedAt,

              assignment: {
                id: submission.assignment.id,
                title: submission.assignment.title,
                description:
                  submission.assignment.description,
                dueDate: submission.assignment.dueDate,

                class: {
                  id: submission.assignment.class.id,
                  name: submission.assignment.class.name,
                },

                subject: {
                  id: submission.assignment.subject.id,
                  name: submission.assignment.subject.name,
                  code: submission.assignment.subject.code,
                },

                teacher: {
                  id: submission.assignment.teacher.id,
                  firstName:
                    submission.assignment.teacher.firstName,
                  lastName:
                    submission.assignment.teacher.lastName,
                },
              },
            })
          ),
        },
      })),
    });
  } catch (error) {
    console.error("Parent dashboard error:", error);

    return NextResponse.json(
      {
        error: "Failed to load parent dashboard",
      },
      {
        status: 500,
      }
    );
  }
}