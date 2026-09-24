import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  verifySession,
  type SessionUser,
} from "@/lib/auth";

type AdminSession = {
  userId: string;
  schoolId: string;
  role: SessionUser["role"];
};

function getTotal(result: {
  assessmentScore: number | null;
  examScore: number | null;
  totalScore: number | null;
}) {
  if (
    typeof result.totalScore === "number" &&
    !Number.isNaN(result.totalScore)
  ) {
    return result.totalScore;
  }

  return (
    (result.assessmentScore ?? 0) +
    (result.examScore ?? 0)
  );
}

function calculateGrade(total: number) {
  if (total >= 80) {
    return {
      grade: "A",
      level: "Level 1",
      meaning: "Excellent",
    };
  }

  if (total >= 70) {
    return {
      grade: "B",
      level: "Level 2",
      meaning: "Very Good",
    };
  }

  if (total >= 60) {
    return {
      grade: "C",
      level: "Level 3",
      meaning: "Good",
    };
  }

  if (total >= 50) {
    return {
      grade: "D",
      level: "Level 4",
      meaning: "Credit",
    };
  }

  if (total >= 40) {
    return {
      grade: "E",
      level: "Level 5",
      meaning: "Pass",
    };
  }

  return {
    grade: "F",
    level: "Level 6",
    meaning: "Needs Improvement",
  };
}

function parseOptionalDate(value: unknown) {
  if (
    typeof value !== "string" ||
    value.trim() === ""
  ) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();

  const token =
    cookieStore.get(SESSION_COOKIE)?.value;

  const session = verifySession(token);

  if (!session) {
    return null;
  }

  if (
    session.role !== "ADMIN" &&
    session.role !== "SUPER_ADMIN"
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
    userId: user.id,
    schoolId: user.schoolId,
    role: user.role,
  };
}

function calculateCompetitionPosition(
  sortedScores: {
    studentId: string;
    score: number;
  }[],
  studentId: string
) {
  const index =
    sortedScores.findIndex(
      (item) =>
        item.studentId === studentId
    );

  if (index === -1) {
    return null;
  }

  const studentScore =
    sortedScores[index].score;

  return (
    sortedScores.filter(
      (item) =>
        item.score > studentScore
    ).length + 1
  );
}

async function validatePeriod(
  schoolId: string,
  academicYearId: string | null,
  termId: string | null
) {
  if (academicYearId) {
    const academicYear =
      await prisma.academicYear.findFirst({
        where: {
          id: academicYearId,
          schoolId,
        },
        select: {
          id: true,
        },
      });

    if (!academicYear) {
      return {
        valid: false,
        error: "Academic year not found.",
      };
    }
  }

  if (termId) {
    const term =
      await prisma.term.findFirst({
        where: {
          id: termId,
          academicYear: {
            schoolId,
            ...(academicYearId
              ? {
                  id: academicYearId,
                }
              : {}),
          },
        },
        select: {
          id: true,
        },
      });

    if (!term) {
      return {
        valid: false,
        error: academicYearId
          ? "Term does not belong to the selected academic year."
          : "Term not found.",
      };
    }
  }

  return {
    valid: true,
    error: null,
  };
}

function buildResultPeriodWhere(
  academicYearId: string | null,
  termId: string | null
) {
  return {
    ...(academicYearId
      ? { academicYearId }
      : {}),
    ...(termId
      ? { termId }
      : {}),
  };
}

export async function GET(request: Request) {
  try {
    const session =
      await getAdminSession();

    if (!session) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    const { searchParams } =
      new URL(request.url);

    const classId =
      searchParams.get("classId");

    const studentId =
      searchParams.get("studentId");

    const academicYearId =
      searchParams.get(
        "academicYearId"
      );

    const termId =
      searchParams.get("termId");

    const periodValidation =
      await validatePeriod(
        session.schoolId,
        academicYearId,
        termId
      );

    if (!periodValidation.valid) {
      return NextResponse.json(
        {
          error:
            periodValidation.error,
        },
        {
          status: 400,
        }
      );
    }

    const resultPeriodWhere =
      buildResultPeriodWhere(
        academicYearId,
        termId
      );

    if (classId) {
      const schoolClass =
        await prisma.schoolClass.findFirst({
          where: {
            id: classId,
            schoolId:
              session.schoolId,
          },
        });

      if (!schoolClass) {
        return NextResponse.json(
          {
            error:
              "Class not found.",
          },
          {
            status: 404,
          }
        );
      }

      const students =
        await prisma.student.findMany({
          where: {
            schoolId:
              session.schoolId,
            classId,
          },
          orderBy: [
            {
              firstName: "asc",
            },
            {
              lastName: "asc",
            },
          ],
          select: {
            id: true,
            studentNumber: true,
            firstName: true,
            lastName: true,
            gender: true,
            class: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: {
                results: true,
              },
            },
          },
        });

      return NextResponse.json(
        students
      );
    }

    if (studentId) {
      const student =
        await prisma.student.findFirst({
          where: {
            id: studentId,
            schoolId:
              session.schoolId,
          },
          select: {
            id: true,
            studentNumber: true,
            firstName: true,
            lastName: true,
            gender: true,
            class: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

      if (!student) {
        return NextResponse.json(
          {
            error:
              "Student not found.",
          },
          {
            status: 404,
          }
        );
      }

      const rawResults =
        await prisma.result.findMany({
          where: {
            studentId,
            ...resultPeriodWhere,
          },
          orderBy: {
            subject: {
              name: "asc",
            },
          },
          select: {
            id: true,
            assessmentScore: true,
            examScore: true,
            totalScore: true,
            grade: true,
            remark: true,
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            teacher: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        });

      let classmates: {
        id: string;
        results: {
          assessmentScore:
            number | null;
          examScore:
            number | null;
          totalScore:
            number | null;
          subjectId: string;
        }[];
      }[] = [];

      if (student.class?.id) {
        classmates =
          await prisma.student.findMany({
            where: {
              schoolId:
                session.schoolId,
              classId:
                student.class.id,
            },
            select: {
              id: true,
              results: {
                where:
                  resultPeriodWhere,
                select: {
                  assessmentScore:
                    true,
                  examScore:
                    true,
                  totalScore:
                    true,
                  subjectId:
                    true,
                },
              },
            },
          });
      }

      const subjectPositions =
        new Map<
          string,
          number | null
        >();

      for (const result of rawResults) {
        const subjectScores =
          classmates
            .map((classmate) => {
              const subjectResult =
                classmate.results.find(
                  (item) =>
                    item.subjectId ===
                    result.subject.id
                );

              if (!subjectResult) {
                return null;
              }

              return {
                studentId:
                  classmate.id,
                score:
                  getTotal(
                    subjectResult
                  ),
              };
            })
            .filter(
              (
                item
              ): item is {
                studentId: string;
                score: number;
              } =>
                item !== null
            )
            .sort(
              (a, b) =>
                b.score - a.score
            );

        subjectPositions.set(
          result.subject.id,
          calculateCompetitionPosition(
            subjectScores,
            student.id
          )
        );
      }

      const results =
        rawResults.map(
          (result) => {
            const total =
              getTotal(result);

            const calculated =
              calculateGrade(total);

            return {
              id: result.id,
              assessmentScore:
                result.assessmentScore,
              examScore:
                result.examScore,
              totalScore: total,
              grade:
                result.grade ??
                calculated.grade,
              level:
                calculated.level,
              meaning:
                calculated.meaning,
              remark:
                result.remark,
              position:
                subjectPositions.get(
                  result.subject.id
                ) ?? null,
              subject:
                result.subject,
              teacher:
                result.teacher,
            };
          }
        );

      let reportInfo;

      reportInfo =
        await prisma.reportCardInfo.findFirst({
          where: {
            schoolId:
              session.schoolId,
            studentId,
            ...(academicYearId
              ? {
                  academicYearId,
                }
              : {}),
            ...(termId
              ? {
                  termId,
                }
              : {}),
          },
          orderBy: {
            updatedAt: "desc",
          },
          select: {
            id: true,
            academicYearId: true,
            termId: true,
            photoUrl: true,
            vacationDate: true,
            reopeningDate: true,
            promotionStatus: true,
            conduct: true,
            attitude: true,
            interest: true,
            classTeacherRemark:
              true,
            headteacherRemark:
              true,
            classTeacherName:
              true,
            headteacherName:
              true,
            classTeacherSignature:
              true,
            headteacherSignature:
              true,
          },
        });

      const totalMarks =
        results.reduce(
          (sum, result) =>
            sum + result.totalScore,
          0
        );

      const average =
        results.length > 0
          ? totalMarks /
            results.length
          : 0;

      const overallGrade =
        calculateGrade(average);

      let position:
        | number
        | null = null;

      let classSize = 0;

      if (student.class?.id) {
        const classAverages =
          classmates
            .map((classmate) => {
              const marks =
                classmate.results.map(
                  (result) =>
                    getTotal(result)
                );

              if (
                marks.length === 0
              ) {
                return null;
              }

              const total =
                marks.reduce(
                  (
                    sum,
                    mark
                  ) =>
                    sum + mark,
                  0
                );

              return {
                studentId:
                  classmate.id,
                average:
                  total /
                  marks.length,
              };
            })
            .filter(
              (
                item
              ): item is {
                studentId: string;
                average: number;
              } =>
                item !== null
            )
            .sort(
              (a, b) =>
                b.average -
                a.average
            );

        classSize =
          classAverages.length;

        const studentAverage =
          classAverages.find(
            (item) =>
              item.studentId ===
              student.id
          );

        if (studentAverage) {
          position =
            classAverages.filter(
              (item) =>
                item.average >
                studentAverage.average
            ).length + 1;
        }
      }

      const attendanceRecords =
        await prisma.attendance.findMany({
          where: {
            studentId,
            schoolId:
              session.schoolId,
          },
          select: {
            status: true,
          },
        });

      const attendance = {
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        total:
          attendanceRecords.length,
      };

      for (const record of attendanceRecords) {
        const status =
          record.status.toUpperCase();

        if (
          status === "PRESENT"
        ) {
          attendance.present++;
        } else if (
          status === "ABSENT"
        ) {
          attendance.absent++;
        } else if (
          status === "LATE"
        ) {
          attendance.late++;
        } else if (
          status === "EXCUSED"
        ) {
          attendance.excused++;
        }
      }

      return NextResponse.json({
        student,
        reportInfo,
        results,
        statistics: {
          totalMarks,
          average,
          position,
          classSize,
          grade:
            overallGrade.grade,
          level:
            overallGrade.level,
          meaning:
            overallGrade.meaning,
        },
        attendance,
        selectedAcademicYearId:
          academicYearId,
        selectedTermId:
          termId,
      });
    }

    return NextResponse.json(
      {
        error:
          "Provide classId or studentId.",
      },
      {
        status: 400,
      }
    );
  } catch (error) {
    console.error(
      "GET /api/admin/report-card error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load report card data.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session =
      await getAdminSession();

    if (!session) {
      return NextResponse.json(
        {
          error:
            "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await request.json();

    const studentId =
      typeof body.studentId ===
      "string"
        ? body.studentId.trim()
        : "";

    if (!studentId) {
      return NextResponse.json(
        {
          error:
            "Student ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const student =
      await prisma.student.findFirst({
        where: {
          id: studentId,
          schoolId:
            session.schoolId,
        },
        select: {
          id: true,
        },
      });

    if (!student) {
      return NextResponse.json(
        {
          error:
            "Student not found.",
        },
        {
          status: 404,
        }
      );
    }

    const academicYearId =
      typeof body.academicYearId ===
        "string" &&
      body.academicYearId.trim()
        ? body.academicYearId.trim()
        : null;

    const termId =
      typeof body.termId ===
        "string" &&
      body.termId.trim()
        ? body.termId.trim()
        : null;

    const periodValidation =
      await validatePeriod(
        session.schoolId,
        academicYearId,
        termId
      );

    if (!periodValidation.valid) {
      return NextResponse.json(
        {
          error:
            periodValidation.error,
        },
        {
          status: 400,
        }
      );
    }

    const photoUrl =
      typeof body.photoUrl ===
        "string" &&
      body.photoUrl.trim()
        ? body.photoUrl.trim()
        : null;

    const vacationDate =
      parseOptionalDate(
        body.vacationDate
      );

    const reopeningDate =
      parseOptionalDate(
        body.reopeningDate
      );

    const promotionStatus =
      typeof body.promotionStatus ===
        "string" &&
      body.promotionStatus.trim()
        ? body.promotionStatus.trim()
        : null;

    const conduct =
      typeof body.conduct ===
        "string" &&
      body.conduct.trim()
        ? body.conduct.trim()
        : null;

    const attitude =
      typeof body.attitude ===
        "string" &&
      body.attitude.trim()
        ? body.attitude.trim()
        : null;

    const interest =
      typeof body.interest ===
        "string" &&
      body.interest.trim()
        ? body.interest.trim()
        : null;

    const classTeacherRemark =
      typeof body.classTeacherRemark ===
        "string" &&
      body.classTeacherRemark.trim()
        ? body.classTeacherRemark.trim()
        : null;

    const headteacherRemark =
      typeof body.headteacherRemark ===
        "string" &&
      body.headteacherRemark.trim()
        ? body.headteacherRemark.trim()
        : null;

    const classTeacherName =
      typeof body.classTeacherName ===
        "string" &&
      body.classTeacherName.trim()
        ? body.classTeacherName.trim()
        : null;

    const headteacherName =
      typeof body.headteacherName ===
        "string" &&
      body.headteacherName.trim()
        ? body.headteacherName.trim()
        : null;

    const classTeacherSignature =
      typeof body.classTeacherSignature ===
        "string" &&
      body.classTeacherSignature.trim()
        ? body.classTeacherSignature.trim()
        : null;

    const headteacherSignature =
      typeof body.headteacherSignature ===
        "string" &&
      body.headteacherSignature.trim()
        ? body.headteacherSignature.trim()
        : null;

    const reportWhere = {
      schoolId:
        session.schoolId,
      studentId,
      ...(academicYearId
        ? { academicYearId }
        : {}),
      ...(termId
        ? { termId }
        : {}),
    };

    const existing =
      await prisma.reportCardInfo.findFirst({
        where: reportWhere,
        select: {
          id: true,
        },
      });

    const reportData = {
      ...(academicYearId
        ? { academicYearId }
        : {}),
      ...(termId
        ? { termId }
        : {}),
      photoUrl,
      vacationDate,
      reopeningDate,
      promotionStatus,
      conduct,
      attitude,
      interest,
      classTeacherRemark,
      headteacherRemark,
      classTeacherName,
      headteacherName,
      classTeacherSignature,
      headteacherSignature,
    };

    if (existing) {
      const updated =
        await prisma.reportCardInfo.update({
          where: {
            id: existing.id,
          },
          data: reportData,
        });

      return NextResponse.json({
        success: true,
        reportInfo: updated,
      });
    }

    const created =
      await prisma.reportCardInfo.create({
        data: {
          schoolId:
            session.schoolId,
          studentId,
          ...reportData,
        },
      });

    return NextResponse.json(
      {
        success: true,
        reportInfo: created,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "PUT /api/admin/report-card error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to save report card information.",
      },
      {
        status: 500,
      }
    );
  }
}