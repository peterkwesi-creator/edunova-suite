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
    (session.role !== "ADMIN" &&
      session.role !== "SUPER_ADMIN")
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

  if (!user) return null;

  return session;
}

function formatStudent(student: any) {
  return {
    id: student.id,
    admissionNumber: student.studentNumber,
    firstName: student.firstName,
    lastName: student.lastName,
    gender: student.gender,
    photoUrl: student.photoUrl,
    dateOfBirth: student.dateOfBirth,
    phone: student.phone,
    email: student.email,
    address: student.address,
    guardianName: student.guardianName,
    guardianPhone: student.guardianPhone,
    classId: student.classId,
    class: student.class,
    createdAt: student.createdAt,
    updatedAt: student.updatedAt,
  };
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
  tx: any,
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

  const base = `${safePrefix}.${safeIdentifier}@${safeSlug}.edunova.school`;

  let email = base;
  let counter = 1;

  while (
    await tx.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    })
  ) {
    email = `${safePrefix}.${safeIdentifier}${counter}@${safeSlug}.edunova.school`;
    counter++;
  }

  return email;
}

type ParentInput = {
  name: string;
  phone: string;
  email: string;
  relationship: string;
};

function parseParentInput(
  value: unknown
): ParentInput | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const parent =
    value as Record<string, unknown>;

  const name =
    typeof parent.name === "string"
      ? parent.name.trim()
      : "";

  const phone =
    typeof parent.phone === "string"
      ? parent.phone.trim()
      : "";

  const email =
    typeof parent.email === "string"
      ? parent.email.trim().toLowerCase()
      : "";

  const relationship =
    typeof parent.relationship === "string"
      ? parent.relationship.trim()
      : "";

  if (!name) {
    return null;
  }

  return {
    name,
    phone,
    email,
    relationship,
  };
}

function splitParentName(name: string) {
  const parts = name.trim().split(/\s+/);

  const firstName =
    parts.shift() || "Parent";

  const lastName =
    parts.join(" ") || firstName;

  return {
    firstName,
    lastName,
  };
}

/*
 * GET ALL STUDENTS
 */
export async function GET() {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const students = await prisma.student.findMany({
      where: {
        schoolId: session.schoolId,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      students.map(formatStudent)
    );
  } catch (error) {
    console.error(
      "GET STUDENTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to load students.",
      },
      { status: 500 }
    );
  }
}

/*
 * CREATE STUDENT + AUTOMATIC
 * STUDENT/PARENT PORTALS
 */
export async function POST(
  request: NextRequest
) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    /*
     * Capture the authenticated school ID
     * immediately after the null check.
     *
     * This also makes the value safe to use
     * inside nested transaction functions.
     */
    const schoolId = session.schoolId;

    const body = await request.json();

    const studentNumber =
      typeof body.admissionNumber === "string"
        ? body.admissionNumber.trim()
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

    const classId =
      typeof body.classId === "string"
        ? body.classId.trim()
        : "";

    const photoUrl =
      typeof body.photoUrl === "string" &&
      body.photoUrl.trim()
        ? body.photoUrl.trim()
        : null;

    const phone =
      typeof body.phone === "string" &&
      body.phone.trim()
        ? body.phone.trim()
        : null;

    const email =
      typeof body.email === "string" &&
      body.email.trim()
        ? body.email.trim().toLowerCase()
        : null;

    const address =
      typeof body.address === "string" &&
      body.address.trim()
        ? body.address.trim()
        : null;

    const parent1 = parseParentInput(
      body.parent1
    );

    const parent2 = parseParentInput(
      body.parent2
    );

    /*
     * Legacy guardian fields are retained
     * for compatibility.
     */
    const legacyGuardianName =
      typeof body.guardianName === "string" &&
      body.guardianName.trim()
        ? body.guardianName.trim()
        : null;

    const legacyGuardianPhone =
      typeof body.guardianPhone === "string" &&
      body.guardianPhone.trim()
        ? body.guardianPhone.trim()
        : null;

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

    /*
     * Parent 1 is required.
     *
     * Legacy guardian fields can still
     * populate Parent 1.
     */
    const normalizedParent1 =
      parent1 ||
      (legacyGuardianName
        ? {
            name: legacyGuardianName,
            phone:
              legacyGuardianPhone || "",
            email: "",
            relationship:
              "Parent/Guardian",
          }
        : null);

    if (!normalizedParent1) {
      return NextResponse.json(
        {
          error:
            "Parent / Guardian 1 is required.",
        },
        { status: 400 }
      );
    }

    if (
      !normalizedParent1.name.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Parent / Guardian 1 name is required.",
        },
        { status: 400 }
      );
    }

    if (
      parent2 &&
      !parent2.name.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Parent / Guardian 2 name is required when Parent 2 is provided.",
        },
        { status: 400 }
      );
    }

    if (
      photoUrl &&
      !photoUrl.startsWith(
        "/uploads/students/"
      )
    ) {
      return NextResponse.json(
        {
          error: "Invalid student photo URL.",
        },
        { status: 400 }
      );
    }

    const schoolClass =
      await prisma.schoolClass.findFirst({
        where: {
          id: classId,
          schoolId,
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

    const existingStudent =
      await prisma.student.findUnique({
        where: {
          studentNumber,
        },
      });

    if (existingStudent) {
      return NextResponse.json(
        {
          error:
            "A student with this admission number already exists.",
        },
        { status: 409 }
      );
    }

    let dateOfBirth: Date | null = null;

    if (body.dateOfBirth) {
      const parsedDate = new Date(
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

      dateOfBirth = parsedDate;
    }

    /*
     * Fetch school information for the
     * institutional portal email namespace.
     */
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

    /*
     * Capture the verified school slug
     * after the null check.
     */
    const schoolSlug = school.slug;

    /*
     * Everything below is one transaction.
     */
    const result =
      await prisma.$transaction(
        async (tx) => {
          /*
           * CREATE STUDENT
           */
          const student =
            await tx.student.create({
              data: {
                studentNumber,
                firstName,
                lastName,
                gender,
                photoUrl,
                dateOfBirth,
                phone,
                email,
                address,

                /*
                 * Keep Parent 1 in the
                 * existing legacy fields.
                 */
                guardianName:
                  normalizedParent1.name,

                guardianPhone:
                  normalizedParent1.phone ||
                  null,

                classId,
                schoolId,
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

          /*
           * STUDENT PORTAL
           */
          const studentPortalEmail =
            await generateUniquePortalEmail(
              tx,
              "student",
              studentNumber,
              schoolSlug
            );

          const studentPassword =
            generateTemporaryPassword();

          const studentUser =
            await tx.user.create({
              data: {
                email:
                  studentPortalEmail,
                passwordHash:
                  hashPassword(
                    studentPassword
                  ),
                firstName,
                lastName,
                role: "STUDENT",
                schoolId,
                active: true,
                studentId:
                  student.id,
              },
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                active: true,
              },
            });

          /*
           * CREATE OR REUSE PARENT
           */
          async function createOrReuseParent(
            parentInput: ParentInput,
            isPrimary: boolean
          ) {
            const {
              firstName:
                parentFirstName,
              lastName:
                parentLastName,
            } =
              splitParentName(
                parentInput.name
              );

            let parent = null;

            /*
             * Try phone first.
             */
            if (parentInput.phone) {
              parent =
                await tx.parent.findFirst({
                  where: {
                    schoolId,
                    phone:
                      parentInput.phone,
                  },
                });
            }

            /*
             * Then try email.
             */
            if (
              !parent &&
              parentInput.email
            ) {
              parent =
                await tx.parent.findFirst({
                  where: {
                    schoolId,
                    email:
                      parentInput.email,
                  },
                });
            }

            /*
             * Finally try exact name.
             */
            if (!parent) {
              parent =
                await tx.parent.findFirst({
                  where: {
                    schoolId,
                    firstName:
                      parentFirstName,
                    lastName:
                      parentLastName,
                  },
                });
            }

            /*
             * Create new parent profile.
             */
            if (!parent) {
              parent =
                await tx.parent.create({
                  data: {
                    firstName:
                      parentFirstName,
                    lastName:
                      parentLastName,
                    phone:
                      parentInput.phone ||
                      null,
                    email:
                      parentInput.email ||
                      null,
                    schoolId,
                  },
                });
            } else {
              /*
               * Fill missing contact information
               * on an existing parent.
               */
              const updateData: {
                phone?: string;
                email?: string;
              } = {};

              if (
                !parent.phone &&
                parentInput.phone
              ) {
                updateData.phone =
                  parentInput.phone;
              }

              if (
                !parent.email &&
                parentInput.email
              ) {
                updateData.email =
                  parentInput.email;
              }

              if (
                Object.keys(updateData)
                  .length > 0
              ) {
                parent =
                  await tx.parent.update({
                    where: {
                      id: parent.id,
                    },
                    data: updateData,
                  });
              }
            }

            /*
             * Connect parent to student.
             */
            await tx.parentStudent.upsert({
              where: {
                parentId_studentId: {
                  parentId: parent.id,
                  studentId: student.id,
                },
              },
              update: {
                relationship:
                  parentInput.relationship ||
                  "Parent/Guardian",
                isPrimary,
              },
              create: {
                parentId: parent.id,
                studentId: student.id,
                relationship:
                  parentInput.relationship ||
                  "Parent/Guardian",
                isPrimary,
              },
            });

            /*
             * Check existing parent portal.
             */
            const existingParentUser =
              await tx.user.findUnique({
                where: {
                  parentId: parent.id,
                },
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              });

            if (existingParentUser) {
              return {
                email:
                  existingParentUser.email,
                password: null,
                existing: true,
              };
            }

            /*
             * Generate parent portal email.
             */
            const parentIdentifier =
              parentInput.phone ||
              `${parent.firstName}-${parent.lastName}-${parent.id.slice(
                -6
              )}`;

            const parentEmail =
              await generateUniquePortalEmail(
                tx,
                "parent",
                parentIdentifier,
                schoolSlug
              );

            const parentPassword =
              generateTemporaryPassword();

            await tx.user.create({
              data: {
                email: parentEmail,
                passwordHash:
                  hashPassword(
                    parentPassword
                  ),
                firstName:
                  parent.firstName,
                lastName:
                  parent.lastName,
                role: "PARENT",
                schoolId,
                active: true,
                parentId:
                  parent.id,
              },
            });

            return {
              email: parentEmail,
              password:
                parentPassword,
              existing: false,
            };
          }

          /*
           * PARENT 1 — REQUIRED
           */
          const firstParent =
            await createOrReuseParent(
              normalizedParent1,
              true
            );

          /*
           * PARENT 2 — OPTIONAL
           */
          const secondParent =
            parent2
              ? await createOrReuseParent(
                  parent2,
                  false
                )
              : null;

          return {
            student,

            studentPortal: {
              id: studentUser.id,
              email:
                studentUser.email,
            },

            studentPassword,

            parents: {
              first:
                firstParent,

              second:
                secondParent,
            },
          };
        }
      );

    return NextResponse.json(
      {
        message:
          "Student and portal accounts created successfully.",

        student:
          formatStudent(
            result.student
          ),

        portals: {
          student: {
            email:
              result.studentPortal
                .email,
            password:
              result.studentPassword,
          },

          parents: {
            first:
              result.parents.first,

            second:
              result.parents.second,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "CREATE STUDENT ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to create student and portal accounts.",
      },
      { status: 500 }
    );
  }
}