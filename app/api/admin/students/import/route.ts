import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  SESSION_COOKIE,
  verifySession,
} from "@/lib/auth";

type CsvRow = {
  admissionNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  address: string;
  className: string;

  parent1Name: string;
  parent1Phone: string;
  parent1Email: string;
  parent1Relationship: string;

  parent2Name: string;
  parent2Phone: string;
  parent2Email: string;
  parent2Relationship: string;
};

type CredentialRow = {
  accountType: "STUDENT" | "PARENT";
  name: string;
  admissionNumber: string;
  loginEmail: string;
  temporaryPassword: string;
  status: "NEW" | "EXISTING";
};

type ImportResult = {
  rowNumber: number;
  admissionNumber: string;
  studentName: string;
  status: "CREATED" | "SKIPPED" | "FAILED";
  message: string;
};

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

  if (!user) {
    return null;
  }

  return session;
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

function normalizeHeader(value: string) {
  return value
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[_-]/g, "");
}

function parseCsvLine(line: string) {
  const values: string[] = [];

  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const character = line[i];

    if (character === '"') {
      if (
        insideQuotes &&
        line[i + 1] === '"'
      ) {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }

      continue;
    }

    if (
      character === "," &&
      !insideQuotes
    ) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += character;
  }

  values.push(current.trim());

  return values;
}

function parseCsv(content: string) {
  const lines = content
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.trim() !== "");

  if (lines.length < 2) {
    throw new Error(
      "The CSV file must contain a header row and at least one student row."
    );
  }

  const headers = parseCsvLine(lines[0]).map(
    normalizeHeader
  );

  const headerIndex = new Map<
    string,
    number
  >();

  headers.forEach((header, index) => {
    headerIndex.set(header, index);
  });

  /*
   * Required fields for every imported student.
   *
   * Parent 1 Phone is intentionally required
   * because it is used to reliably recognize
   * an existing parent across multiple children.
   */
  const requiredHeaders = [
    "admissionnumber",
    "firstname",
    "lastname",
    "gender",
    "classname",
    "parent1name",
    "parent1phone",
  ];

  const missingHeaders =
    requiredHeaders.filter(
      (header) =>
        !headerIndex.has(header)
    );

  if (missingHeaders.length > 0) {
    throw new Error(
      `Missing required CSV columns: ${missingHeaders.join(
        ", "
      )}`
    );
  }

  function getValue(
    values: string[],
    name: string
  ) {
    const index =
      headerIndex.get(name);

    if (index === undefined) {
      return "";
    }

    return (
      values[index]?.trim() || ""
    );
  }

  const rows: CsvRow[] = [];

  for (
    let index = 1;
    index < lines.length;
    index++
  ) {
    const values = parseCsvLine(
      lines[index]
    );

    rows.push({
      admissionNumber:
        getValue(
          values,
          "admissionnumber"
        ),

      firstName:
        getValue(
          values,
          "firstname"
        ),

      lastName:
        getValue(
          values,
          "lastname"
        ),

      gender:
        getValue(
          values,
          "gender"
        ),

      dateOfBirth:
        getValue(
          values,
          "dateofbirth"
        ),

      phone:
        getValue(
          values,
          "phone"
        ),

      email:
        getValue(
          values,
          "email"
        ),

      address:
        getValue(
          values,
          "address"
        ),

      className:
        getValue(
          values,
          "classname"
        ),

      parent1Name:
        getValue(
          values,
          "parent1name"
        ),

      parent1Phone:
        getValue(
          values,
          "parent1phone"
        ),

      parent1Email:
        getValue(
          values,
          "parent1email"
        ),

      parent1Relationship:
        getValue(
          values,
          "parent1relationship"
        ) || "Parent",

      parent2Name:
        getValue(
          values,
          "parent2name"
        ),

      parent2Phone:
        getValue(
          values,
          "parent2phone"
        ),

      parent2Email:
        getValue(
          values,
          "parent2email"
        ),

      parent2Relationship:
        getValue(
          values,
          "parent2relationship"
        ) || "Parent",
    });
  }

  return rows;
}

function parseDate(value: string) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return null;
  }

  return parsed;
}

function splitParentName(name: string) {
  const parts =
    name.trim().split(/\s+/);

  const firstName =
    parts.shift() || "Parent";

  const lastName =
    parts.join(" ") || firstName;

  return {
    firstName,
    lastName,
  };
}

function escapeCsvValue(
  value: unknown
) {
  const stringValue =
    String(value ?? "");

  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(
      /"/g,
      '""'
    )}"`;
  }

  return stringValue;
}

function credentialsToCsv(
  credentials: CredentialRow[]
) {
  const headers = [
    "Account Type",
    "Name",
    "Admission Number",
    "Login Email",
    "Temporary Password",
    "Status",
  ];

  const rows = credentials.map(
    (credential) =>
      [
        credential.accountType,
        credential.name,
        credential.admissionNumber,
        credential.loginEmail,
        credential.temporaryPassword,
        credential.status,
      ]
        .map(escapeCsvValue)
        .join(",")
  );

  return [
    headers.join(","),
    ...rows,
  ].join("\n");
}

export async function POST(
  request: NextRequest
) {
  try {
    const session =
      await getAdminSession();

    if (!session) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const schoolId =
      session.schoolId;

    const formData =
      await request.formData();

    const file =
      formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error:
            "Please upload a CSV file.",
        },
        { status: 400 }
      );
    }

    if (
      !file.name
        .toLowerCase()
        .endsWith(".csv")
    ) {
      return NextResponse.json(
        {
          error:
            "Only CSV files are supported in this version. Save your Excel spreadsheet as CSV and upload it again.",
        },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        {
          error:
            "The uploaded CSV file is empty.",
        },
        { status: 400 }
      );
    }

    if (
      file.size >
      10 * 1024 * 1024
    ) {
      return NextResponse.json(
        {
          error:
            "The CSV file is too large. Maximum size is 10 MB.",
        },
        { status: 400 }
      );
    }

    const content =
      await file.text();

    let rows: CsvRow[];

    try {
      rows = parseCsv(content);
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Invalid CSV file.",
        },
        { status: 400 }
      );
    }

    if (rows.length > 2000) {
      return NextResponse.json(
        {
          error:
            "A maximum of 2,000 students can be imported at once.",
        },
        { status: 400 }
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
          error:
            "School was not found.",
        },
        { status: 404 }
      );
    }

    const schoolSlug =
      school.slug;

    const results: ImportResult[] =
      [];

    const credentials: CredentialRow[] =
      [];

    const importedAdmissionNumbers =
      new Set<string>();

    for (
      let index = 0;
      index < rows.length;
      index++
    ) {
      const row =
        rows[index];

      const rowNumber =
        index + 2;

      const admissionNumber =
        row.admissionNumber.trim();

      const studentName =
        `${row.firstName} ${row.lastName}`.trim();

      /*
       * Parent 1 name AND phone are
       * explicitly required for every row.
       */
      if (
        !admissionNumber ||
        !row.firstName ||
        !row.lastName ||
        !row.gender ||
        !row.className ||
        !row.parent1Name ||
        !row.parent1Phone
      ) {
        const missingFields: string[] =
          [];

        if (!admissionNumber) {
          missingFields.push(
            "Admission Number"
          );
        }

        if (!row.firstName) {
          missingFields.push(
            "First Name"
          );
        }

        if (!row.lastName) {
          missingFields.push(
            "Last Name"
          );
        }

        if (!row.gender) {
          missingFields.push(
            "Gender"
          );
        }

        if (!row.className) {
          missingFields.push(
            "Class Name"
          );
        }

        if (!row.parent1Name) {
          missingFields.push(
            "Parent 1 Name"
          );
        }

        if (!row.parent1Phone) {
          missingFields.push(
            "Parent 1 Phone"
          );
        }

        results.push({
          rowNumber,
          admissionNumber,
          studentName,
          status: "FAILED",
          message:
            `Missing required field(s): ${missingFields.join(
              ", "
            )}.`,
        });

        continue;
      }

      const normalizedAdmissionNumber =
        admissionNumber.toLowerCase();

      if (
        importedAdmissionNumbers.has(
          normalizedAdmissionNumber
        )
      ) {
        results.push({
          rowNumber,
          admissionNumber,
          studentName,
          status: "SKIPPED",
          message:
            "Duplicate admission number found in this CSV.",
        });

        continue;
      }

      importedAdmissionNumbers.add(
        normalizedAdmissionNumber
      );

      try {
        const existingStudent =
          await prisma.student.findUnique(
            {
              where: {
                studentNumber:
                  admissionNumber,
              },
              select: {
                id: true,
              },
            }
          );

        if (existingStudent) {
          results.push({
            rowNumber,
            admissionNumber,
            studentName,
            status: "SKIPPED",
            message:
              "A student with this admission number already exists.",
          });

          continue;
        }

        const schoolClass =
          await prisma.schoolClass.findFirst(
            {
              where: {
                schoolId,
                name: row.className,
              },
              select: {
                id: true,
                name: true,
              },
            }
          );

        if (!schoolClass) {
          results.push({
            rowNumber,
            admissionNumber,
            studentName,
            status: "FAILED",
            message:
              `Class "${row.className}" was not found in this school.`,
          });

          continue;
        }

        const dateOfBirth =
          parseDate(
            row.dateOfBirth
          );

        if (
          row.dateOfBirth &&
          !dateOfBirth
        ) {
          results.push({
            rowNumber,
            admissionNumber,
            studentName,
            status: "FAILED",
            message:
              "Invalid date of birth.",
          });

          continue;
        }

        await prisma.$transaction(
          async (tx) => {
            /*
             * CREATE STUDENT
             */
            const student =
              await tx.student.create({
                data: {
                  studentNumber:
                    admissionNumber,

                  firstName:
                    row.firstName,

                  lastName:
                    row.lastName,

                  gender:
                    row.gender,

                  dateOfBirth,

                  phone:
                    row.phone || null,

                  email:
                    row.email
                      ? row.email.toLowerCase()
                      : null,

                  address:
                    row.address || null,

                  guardianName:
                    row.parent1Name,

                  guardianPhone:
                    row.parent1Phone,

                  classId:
                    schoolClass.id,

                  schoolId,
                },
                select: {
                  id: true,
                  studentNumber: true,
                  firstName: true,
                  lastName: true,
                },
              });

            /*
             * STUDENT PORTAL
             */
            const studentEmail =
              await generateUniquePortalEmail(
                tx,
                "student",
                admissionNumber,
                schoolSlug
              );

            const studentPassword =
              generateTemporaryPassword();

            await tx.user.create({
              data: {
                email:
                  studentEmail,

                passwordHash:
                  hashPassword(
                    studentPassword
                  ),

                firstName:
                  student.firstName,

                lastName:
                  student.lastName,

                role: "STUDENT",

                schoolId,

                active: true,

                studentId:
                  student.id,
              },
            });

            credentials.push({
              accountType:
                "STUDENT",

              name:
                `${student.firstName} ${student.lastName}`,

              admissionNumber:
                student.studentNumber,

              loginEmail:
                studentEmail,

              temporaryPassword:
                studentPassword,

              status: "NEW",
            });

            /*
             * CREATE OR REUSE PARENT
             */
            async function createOrReuseParent(
              name: string,
              phone: string,
              email: string,
              relationship: string
            ) {
              const nameParts =
                splitParentName(
                  name
                );

              let parent = null;

              /*
               * Parent phone is the primary
               * matching identifier.
               */
              parent =
                await tx.parent.findFirst(
                  {
                    where: {
                      schoolId,
                      phone,
                    },
                  }
                );

              /*
               * If no phone match exists,
               * try email.
               */
              if (
                !parent &&
                email
              ) {
                parent =
                  await tx.parent.findFirst(
                    {
                      where: {
                        schoolId,
                        email:
                          email.toLowerCase(),
                      },
                    }
                  );
              }

              /*
               * Finally use exact name.
               */
              if (!parent) {
                parent =
                  await tx.parent.findFirst(
                    {
                      where: {
                        schoolId,
                        firstName:
                          nameParts.firstName,
                        lastName:
                          nameParts.lastName,
                      },
                    }
                  );
              }

              if (!parent) {
                parent =
                  await tx.parent.create(
                    {
                      data: {
                        firstName:
                          nameParts.firstName,

                        lastName:
                          nameParts.lastName,

                        phone,

                        email:
                          email
                            ? email.toLowerCase()
                            : null,

                        schoolId,
                      },
                    }
                  );
              } else {
                const updateData: {
                  email?: string;
                } = {};

                if (
                  !parent.email &&
                  email
                ) {
                  updateData.email =
                    email.toLowerCase();
                }

                if (
                  Object.keys(
                    updateData
                  ).length > 0
                ) {
                  parent =
                    await tx.parent.update(
                      {
                        where: {
                          id: parent.id,
                        },
                        data: updateData,
                      }
                    );
                }
              }

              /*
               * Connect parent to student.
               */
              await tx.parentStudent.upsert(
                {
                  where: {
                    parentId_studentId: {
                      parentId:
                        parent.id,
                      studentId:
                        student.id,
                    },
                  },

                  update: {
                    relationship:
                      relationship ||
                      "Parent",

                    isPrimary:
                      relationship
                        .toLowerCase()
                        .includes(
                          "father"
                        ) ||
                      relationship
                        .toLowerCase()
                        .includes(
                          "mother"
                        ),
                  },

                  create: {
                    parentId:
                      parent.id,

                    studentId:
                      student.id,

                    relationship:
                      relationship ||
                      "Parent",

                    isPrimary:
                      relationship
                        .toLowerCase()
                        .includes(
                          "father"
                        ) ||
                      relationship
                        .toLowerCase()
                        .includes(
                          "mother"
                        ),
                  },
                }
              );

              /*
               * Reuse existing parent portal.
               */
              const existingUser =
                await tx.user.findUnique(
                  {
                    where: {
                      parentId:
                        parent.id,
                    },
                    select: {
                      id: true,
                      email: true,
                    },
                  }
                );

              if (existingUser) {
                return {
                  email:
                    existingUser.email,
                  password: "",
                  existing: true,
                };
              }

              const identifier =
                phone ||
                `${parent.firstName}-${parent.lastName}-${parent.id.slice(
                  -6
                )}`;

              const parentEmail =
                await generateUniquePortalEmail(
                  tx,
                  "parent",
                  identifier,
                  schoolSlug
                );

              const parentPassword =
                generateTemporaryPassword();

              await tx.user.create({
                data: {
                  email:
                    parentEmail,

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
                email:
                  parentEmail,

                password:
                  parentPassword,

                existing: false,
              };
            }

            /*
             * PARENT 1 — REQUIRED
             */
            const parent1 =
              await createOrReuseParent(
                row.parent1Name,
                row.parent1Phone,
                row.parent1Email,
                row.parent1Relationship
              );

            if (
              !parent1.existing
            ) {
              credentials.push({
                accountType:
                  "PARENT",

                name:
                  row.parent1Name,

                admissionNumber:
                  admissionNumber,

                loginEmail:
                  parent1.email,

                temporaryPassword:
                  parent1.password,

                status: "NEW",
              });
            }

            /*
             * PARENT 2 — OPTIONAL
             */
            if (
              row.parent2Name
            ) {
              /*
               * If Parent 2 has a name but
               * no phone, allow the import.
               *
               * Parent 2 is optional.
               */
              const parent2 =
                await createOrReuseParent(
                  row.parent2Name,
                  row.parent2Phone,
                  row.parent2Email,
                  row.parent2Relationship
                );

              if (
                !parent2.existing
              ) {
                credentials.push({
                  accountType:
                    "PARENT",

                  name:
                    row.parent2Name,

                  admissionNumber:
                    admissionNumber,

                  loginEmail:
                    parent2.email,

                  temporaryPassword:
                    parent2.password,

                  status: "NEW",
                });
              }
            }
          }
        );

        results.push({
          rowNumber,
          admissionNumber,
          studentName,
          status: "CREATED",
          message:
            `Student imported successfully into ${schoolClass.name}.`,
        });
      } catch (error) {
        console.error(
          `IMPORT ROW ${rowNumber} ERROR:`,
          error
        );

        results.push({
          rowNumber,
          admissionNumber,
          studentName,
          status: "FAILED",
          message:
            "An unexpected error occurred while importing this student.",
        });
      }
    }

    const created =
      results.filter(
        (item) =>
          item.status ===
          "CREATED"
      ).length;

    const skipped =
      results.filter(
        (item) =>
          item.status ===
          "SKIPPED"
      ).length;

    const failed =
      results.filter(
        (item) =>
          item.status ===
          "FAILED"
      ).length;

    const credentialsCsv =
      credentialsToCsv(
        credentials
      );

    return NextResponse.json({
      message:
        "Student import completed.",

      summary: {
        totalRows: rows.length,
        created,
        skipped,
        failed,
        credentialsGenerated:
          credentials.length,
      },

      results,

      credentials,

      credentialsCsv,
    });
  } catch (error) {
    console.error(
      "STUDENT IMPORT ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to process student import.",
      },
      { status: 500 }
    );
  }
}