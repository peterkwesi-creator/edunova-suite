import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  verifySession,
} from "@/lib/auth";

const ALLOWED_FOLDERS = [
  "news",
  "gallery",
  "schools",
  "students",
  "teachers",
] as const;

type UploadFolder =
  (typeof ALLOWED_FOLDERS)[number];

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const MAX_SIZE = 10 * 1024 * 1024;

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

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    const file = formData.get("file");

    const folderValue = String(
      formData.get("folder") || "gallery"
    );

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "Please select an image.",
        },
        { status: 400 }
      );
    }

    if (
      !ALLOWED_FOLDERS.includes(
        folderValue as UploadFolder
      )
    ) {
      return NextResponse.json(
        {
          error: "Invalid upload destination.",
        },
        { status: 400 }
      );
    }

    const folder =
      folderValue as UploadFolder;

    const extension =
      ALLOWED_TYPES[file.type];

    if (!extension) {
      return NextResponse.json(
        {
          error:
            "Allowed image types: JPG, PNG, WEBP and GIF.",
        },
        { status: 400 }
      );
    }

    if (
      file.size <= 0 ||
      file.size > MAX_SIZE
    ) {
      return NextResponse.json(
        {
          error:
            "Image must be smaller than 10MB.",
        },
        { status: 400 }
      );
    }

    const uploadDirectory = path.join(
      process.cwd(),
      "public",
      "uploads",
      folder
    );

    await mkdir(uploadDirectory, {
      recursive: true,
    });

    const filename =
      `${randomUUID()}.${extension}`;

    const filepath = path.join(
      uploadDirectory,
      filename
    );

    const bytes =
      await file.arrayBuffer();

    await writeFile(
      filepath,
      Buffer.from(bytes)
    );

    const imageUrl =
      `/uploads/${folder}/${filename}`;

    return NextResponse.json(
      {
        url: imageUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "IMAGE UPLOAD ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to upload image.",
      },
      { status: 500 }
    );
  }
}