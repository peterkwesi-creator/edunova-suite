import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  verifySession,
} from "@/lib/auth";

async function getAdminSession() {
  const cookieStore = await cookies();

  const token =
    cookieStore.get(SESSION_COOKIE)?.value;

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

export async function GET(request: Request) {
  try {
    const session =
      await getAdminSession();

    if (!session) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const { searchParams } =
      new URL(request.url);

    const requestedAcademicYearId =
      searchParams.get(
        "academicYearId"
      );

    const requestedTermId =
      searchParams.get("termId");

    let academicYearId =
      requestedAcademicYearId;

    let termId = requestedTermId;

    /*
     * Resolve current academic period
     * when no period is supplied.
     */
    if (!academicYearId || !termId) {
      const currentAcademicYear =
        await prisma.academicYear.findFirst({
          where: {
            schoolId:
              session.schoolId,
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

      if (currentAcademicYear) {
        academicYearId =
          academicYearId ??
          currentAcademicYear.id;

        const currentTerm =
          currentAcademicYear.terms.find(
            (term) =>
              term.isCurrent
          ) ??
          currentAcademicYear
            .terms[0] ??
          null;

        termId =
          termId ??
          currentTerm?.id ??
          null;
      }
    }

    /*
     * Validate the selected academic period.
     */
    let academicYear = null;
    let term = null;

    if (academicYearId) {
      academicYear =
        await prisma.academicYear.findFirst({
          where: {
            id: academicYearId,
            schoolId:
              session.schoolId,
          },
        });

      if (!academicYear) {
        return NextResponse.json(
          {
            error:
              "Academic year not found.",
          },
          {
            status: 404,
          }
        );
      }
    }

    if (termId) {
      if (!academicYearId) {
        return NextResponse.json(
          {
            error:
              "Academic year is required when a term is selected.",
          },
          {
            status: 400,
          }
        );
      }

      term =
        await prisma.term.findFirst({
          where: {
            id: termId,
            academicYearId,
          },
        });

      if (!term) {
        return NextResponse.json(
          {
            error:
              "Term not found for the selected academic year.",
          },
          {
            status: 404,
          }
        );
      }
    }

    /*
     * 1. ENROLMENT BY CLASS AND GENDER
     *
     * Enrolment is school-wide and is not
     * restricted by result period.
     */
    const students =
      await prisma.student.findMany({
        where: {
          schoolId:
            session.schoolId,
        },
        select: {
          id: true,
          gender: true,
          class: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          firstName: "asc",
        },
      });

    const enrolmentMap: Record<
      string,
      {
        classId: string;
        className: string;
        male: number;
        female: number;
        other: number;
        total: number;
      }
    > = {};

    for (const student of students) {
      const classId =
        student.class?.id ??
        "unassigned";

      const className =
        student.class?.name ??
        "Unassigned";

      if (!enrolmentMap[classId]) {
        enrolmentMap[classId] = {
          classId,
          className,
          male: 0,
          female: 0,
          other: 0,
          total: 0,
        };
      }

      const gender =
        student.gender
          ?.trim()
          .toLowerCase();

      if (gender === "male") {
        enrolmentMap[
          classId
        ].male += 1;
      } else if (
        gender === "female"
      ) {
        enrolmentMap[
          classId
        ].female += 1;
      } else {
        enrolmentMap[
          classId
        ].other += 1;
      }

      enrolmentMap[
        classId
      ].total += 1;
    }

    const enrolment =
      Object.values(
        enrolmentMap
      );

    /*
     * 2. ATTENDANCE SUMMARY
     *
     * Attendance has no academicYearId
     * or termId in the current schema.
     *
     * Therefore, when a term is selected,
     * filter attendance using the term's
     * start/end dates.
     */
    const attendanceWhere: {
      schoolId: string;
      date?: {
        gte: Date;
        lte: Date;
      };
    } = {
      schoolId:
        session.schoolId,
    };

    if (term) {
      attendanceWhere.date = {
        gte: term.startDate,
        lte: term.endDate,
      };
    }

    const attendance =
      await prisma.attendance.findMany({
        where: attendanceWhere,
        select: {
          status: true,
        },
      });

    const attendanceSummary = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      total:
        attendance.length,
    };

    for (const record of attendance) {
      const status =
        record.status
          ?.trim()
          .toUpperCase();

      if (status === "PRESENT") {
        attendanceSummary.present += 1;
      } else if (
        status === "ABSENT"
      ) {
        attendanceSummary.absent += 1;
      } else if (
        status === "LATE"
      ) {
        attendanceSummary.late += 1;
      } else if (
        status === "EXCUSED"
      ) {
        attendanceSummary.excused += 1;
      }
    }

    /*
     * 3. BECE / JHS 3 PERFORMANCE
     *
     * Results are filtered to the selected
     * academic period when one exists.
     */
    const jhs3Students =
      await prisma.student.findMany({
        where: {
          schoolId:
            session.schoolId,
          class: {
            name: {
              contains: "JHS 3",
              mode: "insensitive",
            },
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          studentNumber: true,
        },
        orderBy: {
          firstName: "asc",
        },
      });

    const jhs3StudentIds =
      jhs3Students.map(
        (student) => student.id
      );

    const resultPeriodFilter =
      academicYearId &&
      termId
        ? {
            academicYearId,
            termId,
          }
        : {};

    const beceResults =
      jhs3StudentIds.length > 0
        ? await prisma.result.findMany({
            where: {
              studentId: {
                in: jhs3StudentIds,
              },
              student: {
                schoolId:
                  session.schoolId,
              },
              ...resultPeriodFilter,
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
                student: {
                  firstName:
                    "asc",
                },
              },
              {
                subject: {
                  name: "asc",
                },
              },
            ],
          })
        : [];

    const becePerformance =
      beceResults.map(
        (result) => ({
          studentId:
            result.student.id,
          studentName:
            `${result.student.firstName} ${result.student.lastName}`,
          studentNumber:
            result.student.studentNumber,
          subject:
            result.subject.name,
          subjectCode:
            result.subject.code,
          assessmentScore:
            result.assessmentScore,
          examScore:
            result.examScore,
          totalScore:
            result.totalScore,
          grade:
            result.grade,
          remark:
            result.remark,
        })
      );

    /*
     * 4. STAFF BY POSITION AND GENDER
     *
     * The current Teacher model has no
     * active field. Therefore Teacher records
     * are treated as the school's active
     * staff records for this report.
     */
    const teachers =
      await prisma.teacher.findMany({
        where: {
          schoolId:
            session.schoolId,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          gender: true,
          position: true,
        },
        orderBy: {
          firstName: "asc",
        },
      });

    const staffMap: Record<
      string,
      {
        position: string;
        male: number;
        female: number;
        other: number;
        total: number;
      }
    > = {};

    for (const teacher of teachers) {
      const position =
        teacher.position?.trim() ||
        "Not Specified";

      if (!staffMap[position]) {
        staffMap[position] = {
          position,
          male: 0,
          female: 0,
          other: 0,
          total: 0,
        };
      }

      const gender =
        teacher.gender
          ?.trim()
          .toLowerCase();

      if (gender === "male") {
        staffMap[
          position
        ].male += 1;
      } else if (
        gender === "female"
      ) {
        staffMap[
          position
        ].female += 1;
      } else {
        staffMap[
          position
        ].other += 1;
      }

      staffMap[
        position
      ].total += 1;
    }

    const staff =
      Object.values(staffMap);

    /*
     * TOTALS
     */
    const totalStudents =
      students.length;

    const totalMale =
      students.filter(
        (student) =>
          student.gender
            ?.trim()
            .toLowerCase() ===
          "male"
      ).length;

    const totalFemale =
      students.filter(
        (student) =>
          student.gender
            ?.trim()
            .toLowerCase() ===
          "female"
      ).length;

    const totalStaff =
      teachers.length;

    const totalStaffMale =
      teachers.filter(
        (teacher) =>
          teacher.gender
            ?.trim()
            .toLowerCase() ===
          "male"
      ).length;

    const totalStaffFemale =
      teachers.filter(
        (teacher) =>
          teacher.gender
            ?.trim()
            .toLowerCase() ===
          "female"
      ).length;

    return NextResponse.json({
      period: {
        academicYear:
          academicYear
            ? {
                id: academicYear.id,
                name:
                  academicYear.name,
                startDate:
                  academicYear.startDate,
                endDate:
                  academicYear.endDate,
              }
            : null,
        term: term
          ? {
              id: term.id,
              name: term.name,
              order: term.order,
              startDate:
                term.startDate,
              endDate:
                term.endDate,
            }
          : null,
      },

      enrolment,

      attendance:
        attendanceSummary,

      bece: {
        jhs3Students:
          jhs3Students.length,
        resultsEntered:
          beceResults.length,
        performance:
          becePerformance,
      },

      staff,

      totals: {
        students:
          totalStudents,
        studentsMale:
          totalMale,
        studentsFemale:
          totalFemale,
        staff:
          totalStaff,
        staffMale:
          totalStaffMale,
        staffFemale:
          totalStaffFemale,
      },
    });
  } catch (error) {
    console.error(
      "GES REPORT ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to generate GES report.",
      },
      {
        status: 500,
      }
    );
  }
}