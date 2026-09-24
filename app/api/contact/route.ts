import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";

const ALLOWED_TYPES = [
  "ENQUIRY",
  "ADMISSION",
  "GENERAL",
  "COMPLAINT",
  "FEEDBACK",
];

function cleanOptionalString(
  value: unknown,
  maxLength: number
) {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.trim();

  if (!cleaned) {
    return null;
  }

  return cleaned.slice(0, maxLength);
}

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const schoolId =
      typeof body.schoolId === "string"
        ? body.schoolId.trim()
        : "";

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    const email =
      cleanOptionalString(
        body.email,
        254
      );

    const phone =
      cleanOptionalString(
        body.phone,
        50
      );

    const subject =
      cleanOptionalString(
        body.subject,
        200
      );

    const requestedType =
      typeof body.type === "string"
        ? body.type
            .trim()
            .toUpperCase()
        : "ENQUIRY";

    const type =
      ALLOWED_TYPES.includes(
        requestedType
      )
        ? requestedType
        : "ENQUIRY";

    if (!schoolId) {
      return NextResponse.json(
        {
          error:
            "School ID is required.",
        },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          error: "Name is required.",
        },
        { status: 400 }
      );
    }

    if (name.length > 150) {
      return NextResponse.json(
        {
          error: "Name is too long.",
        },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        {
          error:
            "Message is required.",
        },
        { status: 400 }
      );
    }

    if (message.length > 5000) {
      return NextResponse.json(
        {
          error:
            "Message is too long.",
        },
        { status: 400 }
      );
    }

    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid email address.",
        },
        { status: 400 }
      );
    }

    const school =
      await prisma.school.findUnique({
        where: {
          id: schoolId,
        },
        select: {
          id: true,
        },
      });

    if (!school) {
      return NextResponse.json(
        {
          error:
            "School not found.",
        },
        { status: 404 }
      );
    }

    const contactMessage =
      await prisma.contactMessage.create({
        data: {
          schoolId: school.id,
          name,
          email,
          phone,
          type,
          subject,
          message,
          status: "NEW",
        },
        select: {
          id: true,
        },
      });

    return NextResponse.json(
      {
        success: true,
        message:
          "Message sent successfully.",
        id: contactMessage.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Contact form error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to send message.",
      },
      { status: 500 }
    );
  }
}