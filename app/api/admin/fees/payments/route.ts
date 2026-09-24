import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import {
  verifySession,
  SESSION_COOKIE,
} from "@/lib/auth";

const VALID_PAYMENT_METHODS = [
  "CASH",
  "MOBILE_MONEY",
  "BANK_TRANSFER",
  "CARD",
  "CHEQUE",
  "OTHER",
] as const;

async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
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
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      feeId,
      amount,
      reference,
      method,
    } = body;

    if (
      !feeId ||
      amount === undefined ||
      amount === null
    ) {
      return NextResponse.json(
        {
          error:
            "Fee and payment amount are required.",
        },
        { status: 400 }
      );
    }

    const paymentAmount = Number(amount);

    if (
      !Number.isFinite(paymentAmount) ||
      paymentAmount <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Payment amount must be greater than zero.",
        },
        { status: 400 }
      );
    }

    const normalizedMethod = method
      ? String(method)
          .trim()
          .toUpperCase()
      : "CASH";

    if (
      !VALID_PAYMENT_METHODS.includes(
        normalizedMethod as
          (typeof VALID_PAYMENT_METHODS)[number]
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid payment method.",
        },
        { status: 400 }
      );
    }

    const result =
      await prisma.$transaction(
        async (tx) => {
          const fee =
            await tx.fee.findFirst({
              where: {
                id: String(feeId),
                schoolId:
                  session.schoolId,
              },
              include: {
                payments: {
                  where: {
                    status: "COMPLETED",
                  },
                  select: {
                    amount: true,
                  },
                },
              },
            });

          if (!fee) {
            throw new Error(
              "FEE_NOT_FOUND"
            );
          }

          const alreadyPaid =
            fee.payments.reduce(
              (total, payment) =>
                total + payment.amount,
              0
            );

          const balance =
            fee.amount - alreadyPaid;

          if (balance <= 0) {
            throw new Error(
              "FEE_ALREADY_PAID"
            );
          }

          if (
            paymentAmount > balance
          ) {
            throw new Error(
              `PAYMENT_EXCEEDS_BALANCE:${balance}`
            );
          }

          const payment =
            await tx.payment.create({
              data: {
                feeId: fee.id,
                studentId:
                  fee.studentId,
                amount: paymentAmount,
                reference: reference
                  ? String(
                      reference
                    ).trim()
                  : null,
                method:
                  normalizedMethod,
                status:
                  "COMPLETED",
              },
            });

          const newPaidAmount =
            alreadyPaid +
            paymentAmount;

          const newStatus =
            newPaidAmount >=
            fee.amount
              ? "PAID"
              : newPaidAmount > 0
              ? "PARTIAL"
              : "UNPAID";

          await tx.fee.update({
            where: {
              id: fee.id,
            },
            data: {
              status: newStatus,
            },
          });

          return {
            payment,
            feeStatus: newStatus,
            totalPaid:
              newPaidAmount,
            balance: Math.max(
              fee.amount -
                newPaidAmount,
              0
            ),
          };
        },
        {
          isolationLevel:
            "Serializable",
        }
      );

    return NextResponse.json(
      result,
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Error
    ) {
      if (
        error.message ===
        "FEE_NOT_FOUND"
      ) {
        return NextResponse.json(
          {
            error:
              "Fee record not found.",
          },
          { status: 404 }
        );
      }

      if (
        error.message ===
        "FEE_ALREADY_PAID"
      ) {
        return NextResponse.json(
          {
            error:
              "This fee has already been fully paid.",
          },
          { status: 400 }
        );
      }

      if (
        error.message.startsWith(
          "PAYMENT_EXCEEDS_BALANCE:"
        )
      ) {
        const balance =
          error.message.split(
            ":"
          )[1];

        return NextResponse.json(
          {
            error:
              `Payment cannot exceed the outstanding balance of GH₵ ${Number(
                balance
              ).toFixed(2)}.`,
          },
          { status: 400 }
        );
      }
    }

    console.error(
      "ADMIN FEE PAYMENT ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to record payment.",
      },
      { status: 500 }
    );
  }
}