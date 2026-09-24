import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  SESSION_COOKIE,
  verifySession,
} from "@/lib/auth";

async function getAdminSession() {
  const cookieStore = await cookies();

  const session = verifySession(
    cookieStore.get(SESSION_COOKIE)?.value
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

  const user = await prisma.user.findFirst({
    where: {
      id: session.userId,
      schoolId: session.schoolId,
      role: session.role,
      active: true,
    },
    select: {
      id: true,
    },
  });

  return user ? session : null;
}

function sanitizeIdentifier(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function generateTemporaryPassword() {
  return `Edu${randomBytes(5).toString("hex")}!`;
}

async function generateUniquePortalEmail(
  prefix: string,
  identifier: string,
  schoolSlug: string
) {
  const safePrefix =
    sanitizeIdentifier(prefix) || "user";

  const safeIdentifier =
    sanitizeIdentifier(identifier) || "account";

  const safeSlug =
    sanitizeIdentifier(schoolSlug) || "school";

  const base =
    `${safePrefix}.${safeIdentifier}@${safeSlug}.edunova.school`;

  let email = base;
  let counter = 1;

  while (
    await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    })
  ) {
    email =
      `${safePrefix}.${safeIdentifier}${counter}@${safeSlug}.edunova.school`;

    counter++;
  }

  return email;
}

/*
 * GET ALL TEACHERS
 */
export async function GET() {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const teachers =
      await prisma.teacher.findMany({
        where: {
          schoolId: session.schoolId,
        },
        select: {
          id: true,
          employeeNumber: true,
          firstName: true,
          lastName: true,
          gender: true,
          photoUrl: true,
          phone: true,
          email: true,
          address: true,
          qualification: true,
          specialization: true,
          position: true,
          schoolId: true,
        },
        orderBy: [
          {
            firstName: "asc",
          },
          {
            lastName: "asc",
          },
        ],
      });

    return NextResponse.json(teachers);
  } catch (error) {
    console.error(
      "TEACHERS GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load teachers",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * CREATE TEACHER + AUTOMATIC TEACHER PORTAL
 */
export async function POST(
  request: NextRequest
) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const employeeNumber =
      typeof body.employeeNumber === "string"
        ? body.employeeNumber.trim()
        : "";

    const firstName =
      typeof body.firstName === "string"
        ? body.firstName.trim()
        : "";

    const lastName =
      typeof body.lastName === "string"
        ? body.lastName.trim()
        : "";

    const gender =
      typeof body.gender === "string"
        ? body.gender.trim()
        : "";

    const photoUrl =
      typeof body.photoUrl === "string"
        ? body.photoUrl.trim() || null
        : null;

    const phone =
      typeof body.phone === "string"
        ? body.phone.trim()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase() || null
        : null;

    const address =
      typeof body.address === "string"
        ? body.address.trim() || null
        : null;

    const qualification =
      typeof body.qualification === "string"
        ? body.qualification.trim() || null
        : null;

    const specialization =
      typeof body.specialization === "string"
        ? body.specialization.trim() || null
        : null;

    const position =
      typeof body.position === "string"
        ? body.position.trim() || null
        : null;

    const schoolId =
      session.schoolId;

    if (
      !employeeNumber ||
      !firstName ||
      !lastName ||
      !gender ||
      !phone
    ) {
      return NextResponse.json(
        {
          error:
            "Employee number, first name, last name, gender and phone are required.",
        },
        { status: 400 }
      );
    }

    if (
      photoUrl &&
      !photoUrl.startsWith(
        "/uploads/teachers/"
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid teacher photo URL.",
        },
        { status: 400 }
      );
    }

    if (
      email &&
      !email.includes("@")
    ) {
      return NextResponse.json(
        {
          error:
            "Please provide a valid email address.",
        },
        { status: 400 }
      );
    }

    const existingTeacher =
      await prisma.teacher.findUnique({
        where: {
          employeeNumber,
        },
        select: {
          id: true,
        },
      });

    if (existingTeacher) {
      return NextResponse.json(
        {
          error:
            "A teacher with this employee number already exists.",
        },
        { status: 409 }
      );
    }

    const school =
      await prisma.school.findUnique({
        where: {
          id: schoolId,
        },
        select: {
          id: true,
          slug: true,
        },
      });

    if (!school) {
      return NextResponse.json(
        {
          error: "School was not found.",
        },
        { status: 404 }
      );
    }

    const result =
      await prisma.$transaction(
        async (tx) => {
          /*
           * Create teacher profile.
           */
          const teacher =
            await tx.teacher.create({
              data: {
                employeeNumber,
                firstName,
                lastName,
                gender,
                photoUrl,
                phone,
                email,
                address,
                qualification,
                specialization,
                position,
                schoolId,
              },
              select: {
                id: true,
                employeeNumber: true,
                firstName: true,
                lastName: true,
                gender: true,
                photoUrl: true,
                phone: true,
                email: true,
                address: true,
                qualification: true,
                specialization: true,
                position: true,
                schoolId: true,
                createdAt: true,
                updatedAt: true,
              },
            });

          /*
           * Create institutional teacher login.
           */
          const portalEmail =
            await generateUniquePortalEmail(
              "teacher",
              employeeNumber,
              school.slug
            );

          const temporaryPassword =
            generateTemporaryPassword();

          const portalUser =
            await tx.user.create({
              data: {
                email: portalEmail,
                passwordHash:
                  hashPassword(
                    temporaryPassword
                  ),
                firstName,
                lastName,
                role: "TEACHER",
                schoolId,
                active: true,
                teacherId:
                  teacher.id,
              },
              select: {
                id: true,
                email: true,
                role: true,
                active: true,
              },
            });

          return {
            teacher,
            portalUser,
            temporaryPassword,
          };
        }
      );

    return NextResponse.json(
      {
        message:
          "Teacher and portal account created successfully.",

        teacher:
          result.teacher,

        portal: {
          email:
            result.portalUser.email,
          password:
            result.temporaryPassword,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "TEACHERS POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to create teacher and portal account.",
      },
      {
        status: 500,
      }
    );
  }
}