-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."UserRole" ADD VALUE 'ACCOUNTANT';
ALTER TYPE "public"."UserRole" ADD VALUE 'SECRETARY';

-- CreateTable
CREATE TABLE "public"."ClassChatMessage" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" VARCHAR(2000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PaymentTransaction" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "feeId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "initiatedByUserId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'PAYSTACK',
    "providerReference" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "receiptNumber" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClassChatMessage_schoolId_classId_createdAt_idx" ON "public"."ClassChatMessage"("schoolId", "classId", "createdAt");

-- CreateIndex
CREATE INDEX "ClassChatMessage_senderId_idx" ON "public"."ClassChatMessage"("senderId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_providerReference_key" ON "public"."PaymentTransaction"("providerReference");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_receiptNumber_key" ON "public"."PaymentTransaction"("receiptNumber");

-- CreateIndex
CREATE INDEX "PaymentTransaction_schoolId_status_idx" ON "public"."PaymentTransaction"("schoolId", "status");

-- CreateIndex
CREATE INDEX "PaymentTransaction_feeId_status_idx" ON "public"."PaymentTransaction"("feeId", "status");

-- CreateIndex
CREATE INDEX "PaymentTransaction_studentId_idx" ON "public"."PaymentTransaction"("studentId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_initiatedByUserId_idx" ON "public"."PaymentTransaction"("initiatedByUserId");

-- AddForeignKey
ALTER TABLE "public"."ClassChatMessage" ADD CONSTRAINT "ClassChatMessage_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "public"."School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClassChatMessage" ADD CONSTRAINT "ClassChatMessage_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."SchoolClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClassChatMessage" ADD CONSTRAINT "ClassChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "public"."School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_feeId_fkey" FOREIGN KEY ("feeId") REFERENCES "public"."Fee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_initiatedByUserId_fkey" FOREIGN KEY ("initiatedByUserId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
