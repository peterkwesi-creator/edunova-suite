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

  return user
    ? session
    : null;
}

export async function GET() {
  try {
    const session =
      await getAdminSession();

    if (!session) {
      return NextResponse.json(
        {
          error:
            "Unauthorized",
        },
        { status: 401 }
      );
    }

    const classes =
      await prisma.schoolClass.findMany({
        where: {
          schoolId:
            session.schoolId,
        },
        orderBy: {
          name: "asc",
        },
        select: {
          id: true,
          name: true,
          description: true,
          schoolId: true,
        },
      });

    return NextResponse.json(
      classes
    );
  } catch (error) {
    console.error(
      "GET CLASSES ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to fetch classes",
      },
      { status: 500 }
    );
  }
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
          error:
            "Unauthorized",
        },
        { status: 401 }
      );
    }

    const body =
      await request.json();

    const name =
      typeof body.name ===
      "string"
        ? body.name.trim()
        : "";

    const description =
      typeof body.description ===
      "string"
        ? body.description.trim() ||
          null
        : null;

    if (!name) {
      return NextResponse.json(
        {
          error:
            "Class name is required.",
        },
        { status: 400 }
      );
    }

    const existingClass =
      await prisma.schoolClass.findUnique({
        where: {
          schoolId_name: {
            schoolId:
              session.schoolId,
            name,
          },
        },
      });

    if (existingClass) {
      return NextResponse.json(
        {
          error:
            "This class already exists in this school.",
        },
        { status: 409 }
      );
    }

    const newClass =
      await prisma.schoolClass.create({
        data: {
          name,
          description,
          schoolId:
            session.schoolId,
        },
      });

    return NextResponse.json(
      newClass,
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "CREATE CLASS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to create class",
      },
      { status: 500 }
    );
  }
}