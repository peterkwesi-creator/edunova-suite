import {
  NextRequest,
  NextResponse,
} from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  verifySession,
} from "@/lib/auth";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

async function getSuperAdmin() {
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
    session.role !==
      "SUPER_ADMIN"
  ) {
    return null;
  }

  const user =
    await prisma.user.findFirst({
      where: {
        id: session.userId,
        schoolId:
          session.schoolId,
        role: "SUPER_ADMIN",
        active: true,
      },
      select: {
        id: true,
      },
    });

  return user;
}

export async function GET(
  _request: NextRequest,
  { params }: Params
) {
  try {
    const user =
      await getSuperAdmin();

    if (!user) {
      return NextResponse.json(
        { error: "Forbidden." },
        { status: 403 }
      );
    }

    const { id } =
      await params;

    const school =
      await prisma.school.findUnique({
        where: {
          id,
        },
      });

    if (!school) {
      return NextResponse.json(
        {
          error:
            "School not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      school
    );
  } catch (error) {
    console.error(
      "GET SCHOOL ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load school",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: Params
) {
  try {
    const user =
      await getSuperAdmin();

    if (!user) {
      return NextResponse.json(
        { error: "Forbidden." },
        { status: 403 }
      );
    }

    const { id } =
      await params;

    const existingSchool =
      await prisma.school.findUnique({
        where: {
          id,
        },
      });

    if (!existingSchool) {
      return NextResponse.json(
        {
          error:
            "School not found",
        },
        { status: 404 }
      );
    }

    const body =
      await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : existingSchool.name;

    const slug =
      typeof body.slug === "string"
        ? body.slug.trim().toLowerCase()
        : existingSchool.slug;

    if (!name || !slug) {
      return NextResponse.json(
        {
          error:
            "School name and slug are required.",
        },
        { status: 400 }
      );
    }

    const duplicate =
      await prisma.school.findFirst({
        where: {
          slug,
          NOT: {
            id,
          },
        },
      });

    if (duplicate) {
      return NextResponse.json(
        {
          error:
            "Another school already uses this slug.",
        },
        { status: 409 }
      );
    }

    const school =
      await prisma.school.update({
        where: {
          id,
        },
        data: {
          name,
          slug,
          email:
            typeof body.email === "string" &&
            body.email.trim()
              ? body.email.trim()
              : null,
          phone:
            typeof body.phone === "string" &&
            body.phone.trim()
              ? body.phone.trim()
              : null,
          address:
            typeof body.address === "string" &&
            body.address.trim()
              ? body.address.trim()
              : null,
          logo:
            typeof body.logo === "string" &&
            body.logo.trim()
              ? body.logo.trim()
              : null,
          description:
            typeof body.description === "string" &&
            body.description.trim()
              ? body.description.trim()
              : null,
          primaryColor:
            typeof body.primaryColor === "string" &&
            body.primaryColor.trim()
              ? body.primaryColor.trim()
              : null,
          secondaryColor:
            typeof body.secondaryColor === "string" &&
            body.secondaryColor.trim()
              ? body.secondaryColor.trim()
              : null,
          websiteEnabled:
            typeof body.websiteEnabled ===
            "boolean"
              ? body.websiteEnabled
              : existingSchool.websiteEnabled,
          admissionsEnabled:
            typeof body.admissionsEnabled ===
            "boolean"
              ? body.admissionsEnabled
              : existingSchool.admissionsEnabled,
        },
      });

    return NextResponse.json(
      school
    );
  } catch (error) {
    console.error(
      "UPDATE SCHOOL ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to update school",
      },
      { status: 500 }
    );
  }
}