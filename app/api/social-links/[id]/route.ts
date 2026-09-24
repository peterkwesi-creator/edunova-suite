import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import {
  verifySession,
  SESSION_COOKIE,
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
    },
  });

  if (!user) {
    return null;
  }

  return session;
}

function isValidWebUrl(value: string) {
  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" ||
      url.protocol === "http:"
    );
  } catch {
    return false;
  }
}

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const session =
      await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const { id } =
      await context.params;

    const existing =
      await prisma.socialLink.findFirst({
        where: {
          id,
          schoolId: session.schoolId,
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          error:
            "Social link not found.",
        },
        { status: 404 }
      );
    }

    const body = await request.json();

    const platform =
      body.platform !== undefined
        ? String(
            body.platform || ""
          ).trim()
        : existing.platform;

    const url =
      body.url !== undefined
        ? String(body.url || "").trim()
        : existing.url;

    const enabled =
      body.enabled !== undefined
        ? Boolean(body.enabled)
        : existing.enabled;

    if (!platform || !url) {
      return NextResponse.json(
        {
          error:
            "Platform and URL are required.",
        },
        { status: 400 }
      );
    }

    if (platform.length > 50) {
      return NextResponse.json(
        {
          error:
            "Platform name is too long.",
        },
        { status: 400 }
      );
    }

    if (
      url.length > 2048 ||
      !isValidWebUrl(url)
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid HTTP or HTTPS URL.",
        },
        { status: 400 }
      );
    }

    const duplicate =
      await prisma.socialLink.findFirst({
        where: {
          schoolId: session.schoolId,
          platform: {
            equals: platform,
            mode: "insensitive",
          },
          NOT: {
            id: existing.id,
          },
        },
      });

    if (duplicate) {
      return NextResponse.json(
        {
          error:
            `${platform} is already connected.`,
        },
        { status: 409 }
      );
    }

    const updated =
      await prisma.socialLink.update({
        where: {
          id: existing.id,
        },
        data: {
          platform,
          url,
          enabled,
        },
      });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(
      "SOCIAL LINK PUT ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to update social link.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const session =
      await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const { id } =
      await context.params;

    const existing =
      await prisma.socialLink.findFirst({
        where: {
          id,
          schoolId: session.schoolId,
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          error:
            "Social link not found.",
        },
        { status: 404 }
      );
    }

    await prisma.socialLink.delete({
      where: {
        id: existing.id,
      },
    });

    return NextResponse.json({
      message:
        "Social link deleted successfully.",
    });
  } catch (error) {
    console.error(
      "SOCIAL LINK DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to delete social link.",
      },
      { status: 500 }
    );
  }
}