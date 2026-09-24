import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

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
      schoolId: true,
      role: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    ...session,
    schoolId: user.schoolId,
    role: user.role,
  };
}

export async function GET() {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const gallery =
      await prisma.galleryItem.findMany({
        where: {
          schoolId: session.schoolId,
        },
        orderBy: [
          { sortOrder: "asc" },
          { createdAt: "desc" },
        ],
      });

    return NextResponse.json(gallery);
  } catch (error) {
    console.error(
      "GALLERY GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to load gallery.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const contentType =
      request.headers.get("content-type") || "";

    let imageUrl = "";
    let title = "";
    let description = "";

    if (
      contentType.includes(
        "application/json"
      )
    ) {
      const body = await request.json();

      imageUrl =
        typeof body.imageUrl === "string"
          ? body.imageUrl.trim()
          : "";

      title =
        typeof body.title === "string"
          ? body.title.trim()
          : "";

      description =
        typeof body.description === "string"
          ? body.description.trim()
          : "";
    } else {
      const formData =
        await request.formData();

      const file = formData.get("file");

      title = String(
        formData.get("title") || ""
      ).trim();

      description = String(
        formData.get("description") || ""
      ).trim();

      if (file instanceof File) {
        const allowedTypes: Record<
          string,
          string
        > = {
          "image/jpeg": "jpg",
          "image/png": "png",
          "image/webp": "webp",
          "image/gif": "gif",
        };

        const extension =
          allowedTypes[file.type];

        if (!extension) {
          return NextResponse.json(
            {
              error:
                "Allowed image types: JPG, PNG, WEBP and GIF.",
            },
            { status: 400 }
          );
        }

        const maxSize =
          10 * 1024 * 1024;

        if (
          file.size <= 0 ||
          file.size > maxSize
        ) {
          return NextResponse.json(
            {
              error:
                "Image must be smaller than 10MB.",
            },
            { status: 400 }
          );
        }

        const uploadDirectory =
          path.join(
            process.cwd(),
            "public",
            "uploads",
            "gallery"
          );

        await mkdir(
          uploadDirectory,
          {
            recursive: true,
          }
        );

        const filename =
          `${randomUUID()}.${extension}`;

        const filepath =
          path.join(
            uploadDirectory,
            filename
          );

        const bytes =
          await file.arrayBuffer();

        await writeFile(
          filepath,
          Buffer.from(bytes)
        );

        imageUrl =
          `/uploads/gallery/${filename}`;
      }
    }

    if (!imageUrl) {
      return NextResponse.json(
        {
          error:
            "Please select or upload an image.",
        },
        { status: 400 }
      );
    }

    if (
      !imageUrl.startsWith(
        "/uploads/gallery/"
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid gallery image URL.",
        },
        { status: 400 }
      );
    }

    const lastItem =
      await prisma.galleryItem.findFirst({
        where: {
          schoolId:
            session.schoolId,
        },
        orderBy: {
          sortOrder: "desc",
        },
        select: {
          sortOrder: true,
        },
      });

    const galleryItem =
      await prisma.galleryItem.create({
        data: {
          schoolId:
            session.schoolId,
          imageUrl,
          title:
            title || null,
          description:
            description || null,
          published: true,
          sortOrder:
            (lastItem?.sortOrder ?? -1) +
            1,
        },
      });

    return NextResponse.json(
      galleryItem,
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "GALLERY POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to upload gallery image.",
      },
      { status: 500 }
    );
  }
}