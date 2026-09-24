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

    const subjects =
      await prisma.subject.findMany({
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
          code: true,
          description: true,
          schoolId: true,
        },
      });

    return NextResponse.json(
      subjects
    );
  } catch (error) {
    console.error(
      "GET SUBJECTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to fetch subjects",
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

    const code =
      typeof body.code ===
      "string"
        ? body.code
            .trim()
            .toUpperCase()
        : "";

    const description =
      typeof body.description ===
      "string"
        ? body.description.trim() ||
          null
        : null;

    if (!name || !code) {
      return NextResponse.json(
        {
          error:
            "Name and code are required.",
        },
        { status: 400 }
      );
    }

    const existing =
      await prisma.subject.findFirst({
        where: {
          schoolId:
            session.schoolId,
          code,
        },
      });

    if (existing) {
      return NextResponse.json(
        {
          error:
            "A subject with this code already exists in this school.",
        },
        { status: 409 }
      );
    }

    const subject =
      await prisma.subject.create({
        data: {
          name,
          code,
          description,
          schoolId:
            session.schoolId,
        },
      });

    return NextResponse.json(
      subject,
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "CREATE SUBJECT ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to create subject",
      },
      { status: 500 }
    );
  }
}