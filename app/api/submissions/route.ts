import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      error:
        "This endpoint is not available. Use the role-specific submissions API.",
    },
    {
      status: 404,
    }
  );
}

export async function POST() {
  return NextResponse.json(
    {
      error:
        "This endpoint is not available. Use the student assignment submission API.",
    },
    {
      status: 404,
    }
  );
}