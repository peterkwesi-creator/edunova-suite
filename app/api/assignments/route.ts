import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET ALL ASSIGNMENTS
export async function GET() {
  try {
    const assignments = await prisma.assignment.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        class: true,
        subject: true,
        teacher: true,
      },
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("GET ASSIGNMENTS ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch assignments.",
      },
      {
        status: 500,
      }
    );
  }
}

// CREATE ASSIGNMENT
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (
      !body.title ||
      !body.classId ||
      !body.subjectId ||
      !body.teacherId
    ) {
      return NextResponse.json(
        {
          error:
            "Title, class, subject and teacher are required.",
        },
        {
          status: 400,
        }
      );
    }

    const assignment = await prisma.assignment.create({
      data: {
        title: body.title,
        description: body.description || null,
        dueDate: body.dueDate
          ? new Date(body.dueDate)
          : null,
        classId: body.classId,
        subjectId: body.subjectId,
        teacherId: body.teacherId,
      },
      include: {
        class: true,
        subject: true,
        teacher: true,
      },
    });

    return NextResponse.json(assignment, {
      status: 201,
    });
  } catch (error) {
    console.error("CREATE ASSIGNMENT ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to create assignment.",
      },
      {
        status: 500,
      }
    );
  }
}