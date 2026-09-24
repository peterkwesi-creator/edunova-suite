import {
  NextRequest,
  NextResponse,
} from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  verifySession,
  hashPassword,
} from "@/lib/auth";

async function getSuperAdmin() {
  const cookieStore = await cookies();

  const session = verifySession(
    cookieStore.get(SESSION_COOKIE)?.value
  );

  if (
    !session ||
    session.role !== "SUPER_ADMIN"
  ) {
    return null;
  }

  const user = await prisma.user.findFirst({
    where: {
      id: session.userId,
      schoolId: session.schoolId,
      role: "SUPER_ADMIN",
      active: true,
    },
    select: {
      id: true,
    },
  });

  return user;
}

export async function GET() {
  try {
    const user = await getSuperAdmin();

    if (!user) {
      return NextResponse.json(
        { error: "Forbidden." },
        { status: 403 }
      );
    }

    const schools = await prisma.school.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(schools);
  } catch (error) {
    console.error(
      "GET /api/schools:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to load schools",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const user = await getSuperAdmin();

    if (!user) {
      return NextResponse.json(
        { error: "Forbidden." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const slug =
      typeof body.slug === "string"
        ? body.slug.trim().toLowerCase()
        : "";

    const adminFirstName =
      typeof body.adminFirstName === "string"
        ? body.adminFirstName.trim()
        : "";

    const adminLastName =
      typeof body.adminLastName === "string"
        ? body.adminLastName.trim()
        : "";

    const adminEmail =
      typeof body.adminEmail === "string"
        ? body.adminEmail.trim().toLowerCase()
        : "";

    const adminPassword =
      typeof body.adminPassword === "string"
        ? body.adminPassword
        : "";

    const academicYearName =
      typeof body.academicYearName === "string"
        ? body.academicYearName.trim()
        : "";

    const academicYearStartDate =
      typeof body.academicYearStartDate === "string"
        ? body.academicYearStartDate
        : "";

    const academicYearEndDate =
      typeof body.academicYearEndDate === "string"
        ? body.academicYearEndDate
        : "";

    const termName =
      typeof body.termName === "string"
        ? body.termName.trim()
        : "Term 1";

    const termStartDate =
      typeof body.termStartDate === "string"
        ? body.termStartDate
        : "";

    const termEndDate =
      typeof body.termEndDate === "string"
        ? body.termEndDate
        : "";

    if (!name || !slug) {
      return NextResponse.json(
        {
          error:
            "School name and slug are required.",
        },
        { status: 400 }
      );
    }

    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
        slug
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Slug may contain only lowercase letters, numbers and hyphens.",
        },
        { status: 400 }
      );
    }

    if (
      !adminFirstName ||
      !adminLastName ||
      !adminEmail ||
      !adminPassword
    ) {
      return NextResponse.json(
        {
          error:
            "Initial administrator first name, last name, email and password are required.",
        },
        { status: 400 }
      );
    }

    if (adminPassword.length < 6) {
      return NextResponse.json(
        {
          error:
            "Administrator password must be at least 6 characters.",
        },
        { status: 400 }
      );
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(adminEmail)) {
      return NextResponse.json(
        {
          error:
            "Please provide a valid administrator email address.",
        },
        { status: 400 }
      );
    }

    if (
      !academicYearName ||
      !academicYearStartDate ||
      !academicYearEndDate ||
      !termName ||
      !termStartDate ||
      !termEndDate
    ) {
      return NextResponse.json(
        {
          error:
            "Academic year and Term 1 information are required.",
        },
        { status: 400 }
      );
    }

    const yearStart = new Date(
      academicYearStartDate
    );

    const yearEnd = new Date(
      academicYearEndDate
    );

    const termStart = new Date(
      termStartDate
    );

    const termEnd = new Date(
      termEndDate
    );

    if (
      Number.isNaN(yearStart.getTime()) ||
      Number.isNaN(yearEnd.getTime()) ||
      Number.isNaN(termStart.getTime()) ||
      Number.isNaN(termEnd.getTime())
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid academic year or term dates.",
        },
        { status: 400 }
      );
    }

    if (yearEnd <= yearStart) {
      return NextResponse.json(
        {
          error:
            "Academic year end date must be after the start date.",
        },
        { status: 400 }
      );
    }

    if (termEnd <= termStart) {
      return NextResponse.json(
        {
          error:
            "Term 1 end date must be after the start date.",
        },
        { status: 400 }
      );
    }

    if (
      termStart < yearStart ||
      termEnd > yearEnd
    ) {
      return NextResponse.json(
        {
          error:
            "Term 1 dates must fall within the academic year dates.",
        },
        { status: 400 }
      );
    }

    const existingSchool =
      await prisma.school.findUnique({
        where: {
          slug,
        },
      });

    if (existingSchool) {
      return NextResponse.json(
        {
          error:
            "A school with this slug already exists.",
        },
        { status: 409 }
      );
    }

    const existingUser =
      await prisma.user.findUnique({
        where: {
          email: adminEmail,
        },
        select: {
          id: true,
        },
      });

    if (existingUser) {
      return NextResponse.json(
        {
          error:
            "A user with this administrator email already exists.",
        },
        { status: 409 }
      );
    }

    const passwordHash =
      hashPassword(adminPassword);

    const result =
      await prisma.$transaction(
        async (tx) => {
          const school =
            await tx.school.create({
              data: {
                name,
                slug,
                email:
                  typeof body.email ===
                    "string" &&
                  body.email.trim()
                    ? body.email.trim()
                    : null,
                phone:
                  typeof body.phone ===
                    "string" &&
                  body.phone.trim()
                    ? body.phone.trim()
                    : null,
                address:
                  typeof body.address ===
                    "string" &&
                  body.address.trim()
                    ? body.address.trim()
                    : null,
                description:
                  typeof body.description ===
                    "string" &&
                  body.description.trim()
                    ? body.description.trim()
                    : null,
                primaryColor:
                  typeof body.primaryColor ===
                    "string" &&
                  body.primaryColor.trim()
                    ? body.primaryColor.trim()
                    : "#2563eb",
                secondaryColor:
                  typeof body.secondaryColor ===
                    "string" &&
                  body.secondaryColor.trim()
                    ? body.secondaryColor.trim()
                    : "#0f172a",
                websiteEnabled:
                  typeof body.websiteEnabled ===
                  "boolean"
                    ? body.websiteEnabled
                    : true,
                admissionsEnabled:
                  typeof body.admissionsEnabled ===
                  "boolean"
                    ? body.admissionsEnabled
                    : true,
              },
            });

          const admin =
            await tx.user.create({
              data: {
                email: adminEmail,
                passwordHash,
                firstName: adminFirstName,
                lastName: adminLastName,
                role: "ADMIN",
                schoolId: school.id,
                active: true,
              },
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                schoolId: true,
              },
            });

          const academicYear =
            await tx.academicYear.create({
              data: {
                name: academicYearName,
                startDate: yearStart,
                endDate: yearEnd,
                isCurrent: true,
                schoolId: school.id,
              },
            });

          const term =
            await tx.term.create({
              data: {
                name: termName,
                order: 1,
                startDate: termStart,
                endDate: termEnd,
                isCurrent: true,
                academicYearId:
                  academicYear.id,
              },
            });

          return {
            school,
            admin,
            academicYear,
            term,
          };
        }
      );

    return NextResponse.json(
      {
        message:
          "School, initial administrator, academic year and Term 1 created successfully.",
        school: result.school,
        administrator: result.admin,
        academicYear: result.academicYear,
        term: result.term,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/schools:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to create school onboarding data.",
      },
      { status: 500 }
    );
  }
}