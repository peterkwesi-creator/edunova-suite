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

export async function GET(
  _request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
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

    const { id } =
      await context.params;

    const news =
      await prisma.newsItem.findFirst({
        where: {
          id,
          schoolId:
            session.schoolId,
        },
      });

    if (!news) {
      return NextResponse.json(
        {
          error:
            "News item not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      news
    );
  } catch (error) {
    console.error(
      "Admin news GET item error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load news item.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
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

    const { id } =
      await context.params;

    const existing =
      await prisma.newsItem.findFirst({
        where: {
          id,
          schoolId:
            session.schoolId,
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          error:
            "News item not found.",
        },
        { status: 404 }
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
      await prisma.newsItem.update({
        where: {
          id,
        },
        data: {
          title,
          excerpt:
            excerpt || null,
          content,
          imageUrl:
            imageUrl || null,
          published,
          publishedAt:
            existing.publishedAt,
        },
      });

    return NextResponse.json(
      news
    );
  } catch (error) {
    console.error(
      "Admin news PUT error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to update news.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
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

    const { id } =
      await context.params;

    const existing =
      await prisma.newsItem.findFirst({
        where: {
          id,
          schoolId:
            session.schoolId,
        },
        select: {
          id: true,
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          error:
            "News item not found.",
        },
        { status: 404 }
      );
    }

    await prisma.newsItem.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "News deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Admin news DELETE error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to delete news.",
      },
      { status: 500 }
    );
  }
}