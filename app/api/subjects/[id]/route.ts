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

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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

export async function GET(
  _request: NextRequest,
  context: RouteContext
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

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Subject ID is required.",
        },
        { status: 400 }
      );
    }

    const subject =
      await prisma.subject.findFirst({
        where: {
          id,
          schoolId:
            session.schoolId,
        },
        select: {
          id: true,
          name: true,
          code: true,
          description: true,
        },
      });

    if (!subject) {
      return NextResponse.json(
        {
          error:
            "Subject not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      subject
    );
  } catch (error) {
    console.error(
      "GET SUBJECT ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load subject.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
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

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Subject ID is required.",
        },
        { status: 400 }
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

    if (!name) {
      return NextResponse.json(
        {
          error:
            "Subject name is required.",
        },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        {
          error:
            "Subject code is required.",
        },
        { status: 400 }
      );
    }

    const subject =
      await prisma.subject.findFirst({
        where: {
          id,
          schoolId:
            session.schoolId,
        },
      });

    if (!subject) {
      return NextResponse.json(
        {
          error:
            "Subject not found.",
        },
        { status: 404 }
      );
    }

    const duplicate =
      await prisma.subject.findFirst({
        where: {
          schoolId:
            session.schoolId,
          code,
          NOT: {
            id,
          },
        },
      });

    if (duplicate) {
      return NextResponse.json(
        {
          error:
            "Another subject already uses this code.",
        },
        { status: 409 }
      );
    }

    const updatedSubject =
      await prisma.subject.update({
        where: {
          id,
        },
        data: {
          name,
          code,
          description,
        },
        select: {
          id: true,
          name: true,
          code: true,
          description: true,
        },
      });

    return NextResponse.json({
      message:
        "Subject updated successfully.",
      subject:
        updatedSubject,
    });
  } catch (error) {
    console.error(
      "UPDATE SUBJECT ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to update subject.",
      },
      { status: 500 }
    );
  }
}