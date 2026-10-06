import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  verifySession,
} from "@/lib/auth";

async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  const session = verifySession(token);

  if (!session) {
    return null;
  }

  if (
    session.role !== "ADMIN" &&
    session.role !== "SUPER_ADMIN"
  ) {
    return null;
  }

  return session;
}

export async function GET() {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const schoolId = session.schoolId;

    const [fees, payments, accountingEntries] =
      await Promise.all([
        prisma.fee.findMany({
          where: {
            schoolId,
          },
          select: {
            id: true,
            title: true,
            amount: true,
            status: true,
            dueDate: true,
            student: {
              select: {
                id: true,
                studentNumber: true,
                firstName: true,
                lastName: true,
              },
            },
            payments: {
              where: {
                status: "COMPLETED",
              },
              select: {
                amount: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        }),

        prisma.payment.findMany({
          where: {
            student: {
              schoolId,
            },
            status: "COMPLETED",
          },
          select: {
            id: true,
            amount: true,
            reference: true,
            method: true,
            status: true,
            paidAt: true,
            student: {
              select: {
                firstName: true,
                lastName: true,
                studentNumber: true,
              },
            },
            fee: {
              select: {
                title: true,
              },
            },
          },
          orderBy: {
            paidAt: "desc",
          },
          take: 20,
        }),

        prisma.accountingEntry.findMany({
          where: {
            schoolId,
          },
          orderBy: {
            entryDate: "desc",
          },
          take: 50,
        }),
      ]);

    const totalBilled = fees.reduce(
      (sum: number, fee) => sum + Number(fee.amount),
      0
    );

    const totalCollected = payments.reduce(
      (sum: number, payment) =>
        sum + Number(payment.amount),
      0
    );

    const totalExpenses = accountingEntries
      .filter((entry) => entry.type === "EXPENSE")
      .reduce(
        (sum: number, entry) =>
          sum + Number(entry.amount),
        0
      );

    const otherIncome = accountingEntries
      .filter((entry) => entry.type === "INCOME")
      .reduce(
        (sum: number, entry) =>
          sum + Number(entry.amount),
        0
      );

    const outstanding = Math.max(
      totalBilled - totalCollected,
      0
    );

    const collectionRate =
      totalBilled > 0
        ? Math.round(
            (totalCollected / totalBilled) * 100
          )
        : 0;

    const netCashPosition =
      totalCollected +
      otherIncome -
      totalExpenses;

    return NextResponse.json({
      summary: {
        totalBilled,
        totalCollected,
        outstanding,
        collectionRate,
        totalExpenses,
        otherIncome,
        netCashPosition,
      },
      recentPayments: payments,
      recentEntries: accountingEntries,
    });
  } catch (error) {
    console.error(
      "GET /api/admin/accounting error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load accounting data.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const type =
      typeof body.type === "string"
        ? body.type.trim().toUpperCase()
        : "";

    const category =
      typeof body.category === "string"
        ? body.category.trim()
        : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    const amount = Number(body.amount);

    const reference =
      typeof body.reference === "string"
        ? body.reference.trim()
        : null;

    const paymentMethod =
      typeof body.paymentMethod === "string"
        ? body.paymentMethod.trim()
        : null;

    const entryDate =
      typeof body.entryDate === "string" &&
      body.entryDate.trim()
        ? new Date(body.entryDate)
        : new Date();

    if (
      type !== "INCOME" &&
      type !== "EXPENSE"
    ) {
      return NextResponse.json(
        {
          error:
            "Type must be INCOME or EXPENSE.",
        },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        {
          error: "Category is required.",
        },
        { status: 400 }
      );
    }

    if (!description) {
      return NextResponse.json(
        {
          error: "Description is required.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Amount must be greater than zero.",
        },
        { status: 400 }
      );
    }

    if (Number.isNaN(entryDate.getTime())) {
      return NextResponse.json(
        {
          error: "Invalid entry date.",
        },
        { status: 400 }
      );
    }

    const entry =
      await prisma.accountingEntry.create({
        data: {
          schoolId: session.schoolId,
          type,
          category,
          description,
          amount,
          reference: reference || null,
          paymentMethod:
            paymentMethod || null,
          entryDate,
        },
      });

    return NextResponse.json(entry, {
      status: 201,
    });
  } catch (error) {
    console.error(
      "POST /api/admin/accounting error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to create accounting entry.",
      },
      { status: 500 }
    );
  }
}