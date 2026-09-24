import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  verifySession,
} from "@/lib/auth";

async function getParentSession() {
  const cookieStore = await cookies();

  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = verifySession(token);

  if (!session) return null;

  if (session.role !== "PARENT") {
    return null;
  }

  return session;
}

async function getCurrentPeriod(schoolId: string) {
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
    (item) => item.studentId === studentId
  );

  if (!student) return null;

  return (
    scores.filter(
      (item) => item.score > student.score
    ).length + 1
  );
}

export async function GET(request: Request) {
  try {
    const session = await getParentSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        id: session.userId,
        schoolId: session.schoolId,
        active: true,
      },
      include: {
        parent: {
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
        },
      },
    });

    if (!user?.parent) {
      return NextResponse.json(
        { error: "Parent profile not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);

    const requestedStudentId =
      searchParams.get("studentId");

    let academicYearId =
      searchParams.get("academicYearId");

    let termId =
      searchParams.get("termId");

    if (!academicYearId || !termId) {
      const currentPeriod =
        await getCurrentPeriod(session.schoolId);

      academicYearId =
        academicYearId ??
        currentPeriod.academicYear?.id ??
        null;

      termId =
        termId ??
        currentPeriod.term?.id ??
        null;
    }

    const children =
      user.parent.children
        .map((item) => item.student)
        .filter(
          (student) =>
            student.schoolId ===
            session.schoolId
        );

    const selectedStudent =
      children.find(
        (student) =>
          student.id ===
          requestedStudentId
      ) ??
      children[0] ??
      null;

    if (!selectedStudent) {
      return NextResponse.json({
        children: [],
        selectedStudent: null,
        academicYear: null,
        term: null,
        results: [],
        summary: {
          totalSubjects: 0,
          average: 0,
          passed: 0,
          failed: 0,
          position: null,
          classSize: 0,
        },
      });
    }

    if (!academicYearId || !termId) {
      return NextResponse.json({
        children,
        selectedStudent,
        academicYear: null,
        term: null,
        results: [],
        summary: {
          totalSubjects: 0,
          average: 0,
          passed: 0,
          failed: 0,
          position: null,
          classSize: 0,
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

    const term =
      await prisma.term.findFirst({
        where: {
          id: termId,
          academicYearId,
        },
      });

    if (!academicYear || !term) {
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
          studentId: selectedStudent.id,
          academicYearId,
          termId,
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
        },
        orderBy: {
          subject: {
            name: "asc",
          },
        },
      });

    const classmates =
      selectedStudent.classId
        ? await prisma.student.findMany({
            where: {
              schoolId: session.schoolId,
              classId:
                selectedStudent.classId,
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
            },
            select: {
              studentId: true,
              totalScore: true,
            },
          })
        : [];

    const totals = new Map<
      string,
      number[]
    >();

    for (const result of classResults) {
      if (result.totalScore === null)
        continue;

      const current =
        totals.get(result.studentId) ??
        [];

      current.push(result.totalScore);

      totals.set(
        result.studentId,
        current
      );
    }

    const averages = Array.from(
      totals.entries()
    )
      .map(([studentId, scores]) => ({
        studentId,
        score:
          scores.reduce(
            (sum, score) =>
              sum + score,
            0
          ) / scores.length,
      }))
      .sort(
        (a, b) => b.score - a.score
      );

    const position =
      calculatePosition(
        averages,
        selectedStudent.id
      );

    const subjectIds = results.map(
      (result) => result.subjectId
    );

    const subjectResults =
      subjectIds.length > 0
        ? await prisma.result.findMany({
            where: {
              classId:
                selectedStudent.classId ??
                undefined,
              subjectId: {
                in: subjectIds,
              },
              academicYearId,
              termId,
            },
            select: {
              studentId: true,
              subjectId: true,
              totalScore: true,
            },
          })
        : [];

    const resultsWithPositions =
      results.map((result) => {
        const scores =
          subjectResults
            .filter(
              (item) =>
                item.subjectId ===
                  result.subjectId &&
                item.totalScore !== null
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
              scores,
              selectedStudent.id
            ),
        };
      });

    const validScores = results
      .map(
        (result) => result.totalScore
      )
      .filter(
        (score): score is number =>
          score !== null
      );

    const average =
      validScores.length > 0
        ? validScores.reduce(
            (sum, score) =>
              sum + score,
            0
          ) / validScores.length
        : 0;

    const passed =
      validScores.filter(
        (score) => score >= 50
      ).length;

    const failed =
      validScores.filter(
        (score) => score < 50
      ).length;

    return NextResponse.json({
      children,
      selectedStudent,
      academicYear,
      term,
      results:
        resultsWithPositions,
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
      "Parent results error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load parent results",
      },
      { status: 500 }
    );
  }
}