import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  verifySession,
} from "@/lib/auth";

async function getStudentSession() {
  const cookieStore = await cookies();

  const token =
    cookieStore.get(SESSION_COOKIE)?.value;

  const session = verifySession(token);

  if (
    !session ||
    session.role !== "STUDENT"
  ) {
    return null;
  }

  return session;
}

async function getCurrentPeriod(
  schoolId: string
) {
  const academicYear =
    await prisma.academicYear.findFirst({
      where: {
        schoolId,
        isCurrent: true,
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

  if (!academicYear) {
    return {
      academicYear: null,
      term: null,
    };
  }

  const term =
    academicYear.terms.find(
      (item) => item.isCurrent
    ) ??
    academicYear.terms[0] ??
    null;

  return {
    academicYear,
    term,
  };
}

function calculatePosition(
  scores: {
    studentId: string;
    score: number;
  }[],
  studentId: string
) {
  const student = scores.find(
    (item) =>
      item.studentId === studentId
  );

  if (!student) return null;

  return (
    scores.filter(
      (item) =>
        item.score > student.score
    ).length + 1
  );
}

export async function GET(
  request: Request
) {
  try {
    const session =
      await getStudentSession();

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
          role: "STUDENT",
          active: true,
        },
        include: {
          student: true,
        },
      });

    if (!user?.student) {
      return NextResponse.json(
        {
          error:
            "Student profile not found",
        },
        { status: 404 }
      );
    }

    const student = user.student;

    if (
      student.schoolId !==
      session.schoolId
    ) {
      return NextResponse.json(
        {
          error:
            "Student profile does not belong to this school.",
        },
        { status: 403 }
      );
    }

    const { searchParams } =
      new URL(request.url);

    let academicYearId =
      searchParams.get(
        "academicYearId"
      );

    let termId =
      searchParams.get("termId");

    if (
      !academicYearId ||
      !termId
    ) {
      const currentPeriod =
        await getCurrentPeriod(
          session.schoolId
        );

      academicYearId =
        academicYearId ??
        currentPeriod.academicYear
          ?.id ??
        null;

      termId =
        termId ??
        currentPeriod.term?.id ??
        null;
    }

    if (
      !academicYearId ||
      !termId
    ) {
      return NextResponse.json({
        student,
        academicYear: null,
        term: null,
        results: [],
        summary: {
          totalSubjects: 0,
          average: 0,
          passed: 0,
          failed: 0,
          position: null,
        },
      });
    }

    const academicYear =
      await prisma.academicYear.findFirst({
        where: {
          id: academicYearId,
          schoolId: session.schoolId,
        },
      });

    if (!academicYear) {
      return NextResponse.json(
        {
          error:
            "Invalid academic year.",
        },
        { status: 400 }
      );
    }

    const term =
      await prisma.term.findFirst({
        where: {
          id: termId,
          academicYearId:
            academicYear.id,
        },
      });

    if (!term) {
      return NextResponse.json(
        {
          error:
            "Invalid academic year or term.",
        },
        { status: 400 }
      );
    }

    const results =
      await prisma.result.findMany({
        where: {
          studentId: student.id,
          academicYearId,
          termId,
          student: {
            schoolId:
              session.schoolId,
          },
          class: {
            schoolId:
              session.schoolId,
          },
          subject: {
            schoolId:
              session.schoolId,
          },
        },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          class: {
            select: {
              id: true,
              name: true,
            },
          },
          teacher: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          subject: {
            name: "asc",
          },
        },
      });

    const classmates =
      student.classId
        ? await prisma.student.findMany({
            where: {
              schoolId:
                session.schoolId,
              classId:
                student.classId,
            },
            select: {
              id: true,
            },
          })
        : [];

    const classStudentIds =
      classmates.map(
        (item) => item.id
      );

    const classResults =
      classStudentIds.length > 0
        ? await prisma.result.findMany({
            where: {
              studentId: {
                in: classStudentIds,
              },
              academicYearId,
              termId,
              class: {
                schoolId:
                  session.schoolId,
              },
              subject: {
                schoolId:
                  session.schoolId,
              },
            },
            select: {
              studentId: true,
              totalScore: true,
            },
          })
        : [];

    const totals =
      new Map<string, number[]>();

    for (const result of classResults) {
      if (
        result.totalScore === null
      ) {
        continue;
      }

      const existing =
        totals.get(
          result.studentId
        ) ?? [];

      existing.push(
        result.totalScore
      );

      totals.set(
        result.studentId,
        existing
      );
    }

    const classAverages =
      Array.from(
        totals.entries()
      )
        .map(
          ([studentId, scores]) => ({
            studentId,
            score:
              scores.reduce(
                (
                  sum,
                  value
                ) =>
                  sum + value,
                0
              ) /
              scores.length,
          })
        )
        .sort(
          (a, b) =>
            b.score - a.score
        );

    const position =
      calculatePosition(
        classAverages,
        student.id
      );

    const subjectIds =
      results.map(
        (result) =>
          result.subjectId
      );

    const subjectResults =
      subjectIds.length > 0
        ? await prisma.result.findMany({
            where: {
              classId:
                student.classId ??
                undefined,
              subjectId: {
                in: subjectIds,
              },
              academicYearId,
              termId,
              class: {
                schoolId:
                  session.schoolId,
              },
              subject: {
                schoolId:
                  session.schoolId,
              },
            },
            select: {
              studentId: true,
              subjectId: true,
              totalScore: true,
            },
          })
        : [];

    const resultWithPositions =
      results.map((result) => {
        const subjectScores =
          subjectResults
            .filter(
              (item) =>
                item.subjectId ===
                  result.subjectId &&
                item.totalScore !==
                  null
            )
            .map((item) => ({
              studentId:
                item.studentId,
              score:
                item.totalScore as number,
            }))
            .sort(
              (a, b) =>
                b.score - a.score
            );

        return {
          ...result,
          position:
            calculatePosition(
              subjectScores,
              student.id
            ),
        };
      });

    const validScores =
      results
        .map(
          (result) =>
            result.totalScore
        )
        .filter(
          (
            score
          ): score is number =>
            score !== null
        );

    const average =
      validScores.length > 0
        ? validScores.reduce(
            (sum, score) =>
              sum + score,
            0
          ) /
          validScores.length
        : 0;

    const passed =
      validScores.filter(
        (score) =>
          score >= 50
      ).length;

    const failed =
      validScores.filter(
        (score) =>
          score < 50
      ).length;

    return NextResponse.json({
      student,
      academicYear,
      term,
      results:
        resultWithPositions,
      summary: {
        totalSubjects:
          results.length,
        average,
        passed,
        failed,
        position,
        classSize:
          classStudentIds.length,
      },
    });
  } catch (error) {
    console.error(
      "Student results error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load results",
      },
      { status: 500 }
    );
  }
}