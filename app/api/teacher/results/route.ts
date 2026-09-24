import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  verifySession,
  type SessionUser,
} from "@/lib/auth";

type TeacherSession = {
  userId: string;
  schoolId: string;
  role: SessionUser["role"];
};

function getGrade(total: number) {
  if (total >= 80) return "A";
  if (total >= 70) return "B";
  if (total >= 60) return "C";
  if (total >= 50) return "D";
  if (total >= 40) return "E";
  return "F";
}

function getRemark(total: number) {
  if (total >= 80) return "Excellent";
  if (total >= 70) return "Very Good";
  if (total >= 60) return "Good";
  if (total >= 50) return "Pass";
  if (total >= 40) return "Needs Improvement";
  return "Fail";
}

async function getTeacherSession(): Promise<TeacherSession | null> {
  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      SESSION_COOKIE
    )?.value;

  const session =
    verifySession(token);

  if (!session) {
    return null;
  }

  if (
    session.role !==
      "TEACHER" &&
    session.role !==
      "ADMIN" &&
    session.role !==
      "SUPER_ADMIN"
  ) {
    return null;
  }

  return {
    userId:
      session.userId,
    schoolId:
      session.schoolId,
    role:
      session.role,
  };
}

async function getTeacher(
  session: TeacherSession
) {
  const user =
    await prisma.user.findFirst({
      where: {
        id: session.userId,
        schoolId:
          session.schoolId,
        active: true,
      },
      select: {
        id: true,
        email: true,
        teacherId: true,
        role: true,
      },
    });

  if (!user) return null;

  if (user.teacherId) {
    const teacher =
      await prisma.teacher.findFirst({
        where: {
          id: user.teacherId,
          schoolId:
            session.schoolId,
        },
      });

    if (teacher) {
      return teacher;
    }
  }

  if (user.email) {
    const teacher =
      await prisma.teacher.findFirst({
        where: {
          schoolId:
            session.schoolId,
          email: user.email,
        },
      });

    if (teacher) {
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          teacherId:
            teacher.id,
        },
      });

      return teacher;
    }
  }

  return null;
}

async function getCurrentAcademicPeriod(
  schoolId: string
) {
  const academicYear =
    await prisma.academicYear.findFirst({
      where: {
        schoolId,
        isCurrent: true,
      },
      orderBy: {
        startDate: "desc",
      },
      include: {
        terms: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

  if (!academicYear) {
    return {
      academicYear: null,
      term: null,
    };
  }

  const currentTerm =
    academicYear.terms.find(
      (term) =>
        term.isCurrent
    ) ??
    academicYear.terms[0] ??
    null;

  return {
    academicYear,
    term: currentTerm,
  };
}

export async function GET(
  request: Request
) {
  try {
    const session =
      await getTeacherSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const teacher =
      await getTeacher(
        session
      );

    if (!teacher) {
      return NextResponse.json(
        {
          error:
            "Teacher profile not found",
        },
        { status: 404 }
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
        await getCurrentAcademicPeriod(
          session.schoolId
        );

      academicYearId =
        academicYearId ??
        currentPeriod
          .academicYear
          ?.id ??
        null;

      termId =
        termId ??
        currentPeriod.term
          ?.id ??
        null;
    }

    const classSubjects =
      await prisma.classSubject.findMany({
        where: {
          teacherId:
            teacher.id,
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
        },
        orderBy: [
          {
            class: {
              name: "asc",
            },
          },
          {
            subject: {
              name: "asc",
            },
          },
        ],
      });

    const classIds = [
      ...new Set(
        classSubjects.map(
          (item) =>
            item.classId
        )
      ),
    ];

    const students =
      await prisma.student.findMany({
        where: {
          schoolId:
            session.schoolId,
          classId: {
            in:
              classIds.length >
              0
                ? classIds
                : ["__none__"],
          },
        },
        select: {
          id: true,
          studentNumber: true,
          firstName: true,
          lastName: true,
          gender: true,
          classId: true,
          class: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [
          {
            firstName:
              "asc",
          },
          {
            lastName:
              "asc",
          },
        ],
      });

    const results =
      academicYearId &&
      termId
        ? await prisma.result.findMany({
            where: {
              teacherId:
                teacher.id,
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
            },
          })
        : [];

    return NextResponse.json({
      academicYearId,
      termId,
      classSubjects,
      students,
      results,
    });
  } catch (error) {
    console.error(
      "Teacher results GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load teacher results",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    const session =
      await getTeacherSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const teacher =
      await getTeacher(
        session
      );

    if (!teacher) {
      return NextResponse.json(
        {
          error:
            "Teacher profile not found",
        },
        { status: 404 }
      );
    }

    const body =
      await request.json();

    const {
      studentId,
      classId,
      subjectId,
      academicYearId:
        requestedAcademicYearId,
      termId:
        requestedTermId,
      assessmentScore,
      examScore,
    } = body;

    if (
      !studentId ||
      !classId ||
      !subjectId
    ) {
      return NextResponse.json(
        {
          error:
            "studentId, classId and subjectId are required",
        },
        { status: 400 }
      );
    }

    let academicYearId =
      requestedAcademicYearId;

    let termId =
      requestedTermId;

    if (
      !academicYearId ||
      !termId
    ) {
      const currentPeriod =
        await getCurrentAcademicPeriod(
          session.schoolId
        );

      academicYearId =
        academicYearId ??
        currentPeriod
          .academicYear
          ?.id;

      termId =
        termId ??
        currentPeriod.term?.id;
    }

    if (
      !academicYearId ||
      !termId
    ) {
      return NextResponse.json(
        {
          error:
            "No academic year and term are configured. Please create an academic year and current term first.",
        },
        { status: 400 }
      );
    }

    const academicYear =
      await prisma.academicYear.findFirst({
        where: {
          id: academicYearId,
          schoolId:
            session.schoolId,
        },
        include: {
          terms: {
            where: {
              id: termId,
            },
          },
        },
      });

    if (!academicYear) {
      return NextResponse.json(
        {
          error:
            "Academic year or term does not belong to this school.",
        },
        { status: 400 }
      );
    }

    const term =
      academicYear.terms[0];

    if (!term) {
      return NextResponse.json(
        {
          error:
            "The selected term does not belong to the selected academic year.",
        },
        { status: 400 }
      );
    }

    const classSubject =
      await prisma.classSubject.findFirst({
        where: {
          classId,
          subjectId,
          teacherId:
            teacher.id,
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
          class: true,
          subject: true,
        },
      });

    if (!classSubject) {
      return NextResponse.json(
        {
          error:
            "You are not assigned to teach this subject for this class.",
        },
        { status: 403 }
      );
    }

    const student =
      await prisma.student.findFirst({
        where: {
          id: studentId,
          schoolId:
            session.schoolId,
          classId,
        },
      });

    if (!student) {
      return NextResponse.json(
        {
          error:
            "Student not found in the selected class.",
        },
        { status: 404 }
      );
    }

    const assessment =
      Number(
        assessmentScore
      );

    const exam =
      Number(examScore);

    if (
      !Number.isFinite(
        assessment
      ) ||
      !Number.isFinite(exam)
    ) {
      return NextResponse.json(
        {
          error:
            "Assessment and exam scores must be valid numbers.",
        },
        { status: 400 }
      );
    }

    if (
      assessment < 0 ||
      assessment > 50
    ) {
      return NextResponse.json(
        {
          error:
            "Assessment score must be between 0 and 50.",
        },
        { status: 400 }
      );
    }

    if (
      exam < 0 ||
      exam > 50
    ) {
      return NextResponse.json(
        {
          error:
            "Exam score must be between 0 and 50.",
        },
        { status: 400 }
      );
    }

    const total =
      assessment + exam;

    const grade =
      getGrade(total);

    const remark =
      getRemark(total);

    const result =
      await prisma.result.upsert({
        where: {
          studentId_subjectId_academicYearId_termId:
            {
              studentId,
              subjectId,
              academicYearId,
              termId,
            },
        },

        update: {
          classId,
          teacherId:
            teacher.id,
          assessmentScore:
            assessment,
          examScore: exam,
          totalScore: total,
          grade,
          remark,
        },

        create: {
          studentId,
          classId,
          subjectId,
          teacherId:
            teacher.id,
          academicYearId,
          termId,
          assessmentScore:
            assessment,
          examScore: exam,
          totalScore: total,
          grade,
          remark,
        },

        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              studentNumber:
                true,
            },
          },
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
          academicYear: {
            select: {
              id: true,
              name: true,
            },
          },
          term: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

    return NextResponse.json({
      success: true,
      message:
        "Result saved successfully.",
      result,
    });
  } catch (error) {
    console.error(
      "Teacher results POST error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to save result",
      },
      { status: 500 }
    );
  }
}