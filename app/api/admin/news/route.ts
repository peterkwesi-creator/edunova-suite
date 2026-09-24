import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  verifySession,
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
      schoolId: true,
      role: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    ...session,
    role: user.role,
    schoolId: user.schoolId,
  };
}

export async function GET() {
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

    const news =
      await prisma.newsItem.findMany({
        where: {
          schoolId:
            session.schoolId,
        },
        orderBy: {
          publishedAt: "desc",
        },
      });

    return NextResponse.json(news);
  } catch (error) {
    console.error(
      "Admin news GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load news.",
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
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const body =
      await request.json();

    const title = String(
      body.title || ""
    ).trim();

    const excerpt = String(
      body.excerpt || ""
    ).trim();

    const content = String(
      body.content || ""
    ).trim();

    const imageUrl = String(
      body.imageUrl || ""
    ).trim();

    const published =
      body.published !== false;

    if (!title) {
      return NextResponse.json(
        {
          error:
            "News title is required.",
        },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json(
        {
          error:
            "News content is required.",
        },
        { status: 400 }
      );
    }

    const news =
      await prisma.newsItem.create({
        data: {
          schoolId:
            session.schoolId,
          title,
          excerpt:
            excerpt || null,
          content,
          imageUrl:
            imageUrl || null,
          published,
          publishedAt:
            new Date(),
        },
      });

    return NextResponse.json(
      news,
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Admin news POST error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to create news.",
      },
      { status: 500 }
    );
  }
}