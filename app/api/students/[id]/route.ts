import {
  NextRequest,
  NextResponse,
} from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  verifySession,
  SESSION_COOKIE,
} from "@/lib/auth";

async function getAdminSession() {
  const cookieStore =
    await cookies();

  const session =
    verifySession(
      cookieStore.get(
        SESSION_COOKIE
      )?.value
    );

  if (
    !session ||
    (
      session.role !== "ADMIN" &&
      session.role !== "SUPER_ADMIN"
    )
  ) {
    return null;
  }

  const user =
    await prisma.user.findFirst({
      where: {
        id: session.userId,
        schoolId:
          session.schoolId,
        role: session.role,
        active: true,
      },
      select: {
        id: true,
      },
    });

  if (!user) return null;

  return session;
}

function formatStudent(
  student: any
) {
  return {
    id: student.id,
    admissionNumber:
      student.studentNumber,
    firstName:
      student.firstName,
    lastName:
      student.lastName,
    gender:
      student.gender,
    photoUrl:
      student.photoUrl,
    dateOfBirth:
      student.dateOfBirth,
    phone:
      student.phone,
    email:
      student.email,
    address:
      student.address,
    guardianName:
      student.guardianName,
    guardianPhone:
      student.guardianPhone,
    classId:
      student.classId,
    className:
      student.class?.name ||
      "Not assigned",
    class:
      student.class,
    createdAt:
      student.createdAt,
    updatedAt:
      student.updatedAt,
  };
}

export async function GET(
  _request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const session =
      await getAdminSession();

    if (!session) {
      return NextResponse.json(
        {
          error:
            "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const { id } =
      await context.params;

    const student =
      await prisma.student.findFirst({
        where: {
          id,
          schoolId:
            session.schoolId,
        },
        select: {
          id: true,
          studentNumber: true,
          firstName: true,
          lastName: true,
          gender: true,
          photoUrl: true,
          dateOfBirth: true,
          phone: true,
          email: true,
          address: true,
          guardianName: true,
          guardianPhone: true,
          classId: true,
          class: {
            select: {
              id: true,
              name: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      });

    if (!student) {
      return NextResponse.json(
        {
          error:
            "Student not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      formatStudent(student)
    );
  } catch (error) {
    console.error(
      "GET STUDENT ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load student.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const session =
      await getAdminSession();

    if (!session) {
      return NextResponse.json(
        {
          error:
            "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const { id } =
      await context.params;

    const existingStudent =
      await prisma.student.findFirst({
        where: {
          id,
          schoolId:
            session.schoolId,
        },
      });

    if (!existingStudent) {
      return NextResponse.json(
        {
          error:
            "Student not found.",
        },
        { status: 404 }
      );
    }

    const body =
      await request.json();

    const studentNumber =
      typeof body.admissionNumber ===
      "string"
        ? body.admissionNumber.trim()
        : "";

    const firstName =
      typeof body.firstName ===
      "string"
        ? body.firstName.trim()
        : "";

    const lastName =
      typeof body.lastName ===
      "string"
        ? body.lastName.trim()
        : "";

    const gender =
      typeof body.gender ===
      "string"
        ? body.gender.trim()
        : "";

    const classId =
      typeof body.classId ===
      "string"
        ? body.classId.trim()
        : "";

    const photoUrl =
      typeof body.photoUrl ===
        "string" &&
      body.photoUrl.trim()
        ? body.photoUrl.trim()
        : null;

    if (
      photoUrl &&
      !photoUrl.startsWith(
        "/uploads/students/"
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid student photo URL.",
        },
        { status: 400 }
      );
    }

    if (
      !studentNumber ||
      !firstName ||
      !lastName ||
      !gender ||
      !classId
    ) {
      return NextResponse.json(
        {
          error:
            "Admission number, first name, last name, gender and class are required.",
        },
        { status: 400 }
      );
    }

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
            "Selected class was not found.",
        },
        { status: 404 }
      );
    }

    const duplicate =
      await prisma.student.findFirst({
        where: {
          studentNumber,
          schoolId:
            session.schoolId,
          NOT: {
            id,
          },
        },
      });

    if (duplicate) {
      return NextResponse.json(
        {
          error:
            "Another student already uses this admission number.",
        },
        { status: 409 }
      );
    }

    let dateOfBirth:
      | Date
      | null = null;

    if (body.dateOfBirth) {
      const parsedDate =
        new Date(
          body.dateOfBirth
        );

      if (
        Number.isNaN(
          parsedDate.getTime()
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid date of birth.",
          },
          { status: 400 }
        );
      }

      dateOfBirth =
        parsedDate;
    }

    const updatedStudent =
      await prisma.student.update({
        where: {
          id,
        },
        data: {
          studentNumber,
          firstName,
          lastName,
          gender,
          photoUrl,
          dateOfBirth,

          phone:
            typeof body.phone ===
              "string" &&
            body.phone.trim()
              ? body.phone.trim()
              : null,

          email:
            typeof body.email ===
              "string" &&
            body.email.trim()
              ? body.email
                  .trim()
                  .toLowerCase()
              : null,

          address:
            typeof body.address ===
              "string" &&
            body.address.trim()
              ? body.address.trim()
              : null,

          guardianName:
            typeof body.guardianName ===
              "string" &&
            body.guardianName.trim()
              ? body.guardianName.trim()
              : null,

          guardianPhone:
            typeof body.guardianPhone ===
              "string" &&
            body.guardianPhone.trim()
              ? body.guardianPhone.trim()
              : null,

          classId,
        },

        select: {
          id: true,
          studentNumber: true,
          firstName: true,
          lastName: true,
          gender: true,
          photoUrl: true,
          dateOfBirth: true,
          phone: true,
          email: true,
          address: true,
          guardianName: true,
          guardianPhone: true,
          classId: true,
          class: {
            select: {
              id: true,
              name: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      });

    return NextResponse.json(
      formatStudent(
        updatedStudent
      )
    );
  } catch (error) {
    console.error(
      "UPDATE STUDENT ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to update student.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const session =
      await getAdminSession();

    if (!session) {
      return NextResponse.json(
        {
          error:
            "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const { id } =
      await context.params;

    const student =
      await prisma.student.findFirst({
        where: {
          id,
          schoolId:
            session.schoolId,
        },
      });

    if (!student) {
      return NextResponse.json(
        {
          error:
            "Student not found.",
        },
        { status: 404 }
      );
    }

    await prisma.student.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      message:
        "Student deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE STUDENT ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to delete student.",
      },
      { status: 500 }
    );
  }
}