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

export async function GET() {
  try {
    const session =
      await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const links =
      await prisma.socialLink.findMany({
        where: {
          schoolId: session.schoolId,
        },
        orderBy: [
          { sortOrder: "asc" },
          { platform: "asc" },
        ],
      });

    return NextResponse.json(links);
  } catch (error) {
    console.error(
      "SOCIAL LINKS GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load social links.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request
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

    const body = await request.json();

    const platform = String(
      body.platform || ""
    ).trim();

    const url = String(
      body.url || ""
    ).trim();

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
            "Please enter a valid HTTP or HTTPS social media URL.",
        },
        { status: 400 }
      );
    }

    const existing =
      await prisma.socialLink.findFirst({
        where: {
          schoolId: session.schoolId,
          platform: {
            equals: platform,
            mode: "insensitive",
          },
        },
      });

    if (existing) {
      return NextResponse.json(
        {
          error:
            `${platform} is already connected.`,
        },
        { status: 409 }
      );
    }

    const lastLink =
      await prisma.socialLink.findFirst({
        where: {
          schoolId: session.schoolId,
        },
        orderBy: {
          sortOrder: "desc",
        },
        select: {
          sortOrder: true,
        },
      });

    const link =
      await prisma.socialLink.create({
        data: {
          schoolId: session.schoolId,
          platform,
          url,
          enabled: true,
          sortOrder:
            (lastLink?.sortOrder ?? -1) +
            1,
        },
      });

    return NextResponse.json(
      link,
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "SOCIAL LINKS POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to add social media link.",
      },
      { status: 500 }
    );
  }
}