import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { unlink } from "fs/promises";
import path from "path";

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
      await prisma.galleryItem.findFirst({
        where: {
          id,
          schoolId: session.schoolId,
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          error:
            "Gallery image not found.",
        },
        { status: 404 }
      );
    }

    const body = await request.json();

    const updated =
      await prisma.galleryItem.update({
        where: {
          id: existing.id,
        },
        data: {
          published:
            body.published !== undefined
              ? Boolean(body.published)
              : existing.published,

          title:
            body.title !== undefined
              ? String(
                  body.title || ""
                ).trim() || null
              : existing.title,

          description:
            body.description !== undefined
              ? String(
                  body.description || ""
                ).trim() || null
              : existing.description,
        },
      });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(
      "GALLERY PUT ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to update gallery image.",
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
      await prisma.galleryItem.findFirst({
        where: {
          id,
          schoolId: session.schoolId,
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          error:
            "Gallery image not found.",
        },
        { status: 404 }
      );
    }

    await prisma.galleryItem.delete({
      where: {
        id: existing.id,
      },
    });

    if (
      existing.imageUrl.startsWith(
        "/uploads/gallery/"
      )
    ) {
      const filename = path.basename(
        existing.imageUrl
      );

      const filepath = path.join(
        process.cwd(),
        "public",
        "uploads",
        "gallery",
        filename
      );

      try {
        await unlink(filepath);
      } catch {
        // The database record has already
        // been deleted, so a missing local
        // file should not fail the request.
      }
    }

    return NextResponse.json({
      message:
        "Gallery image deleted successfully.",
    });
  } catch (error) {
    console.error(
      "GALLERY DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to delete gallery image.",
      },
      { status: 500 }
    );
  }
}