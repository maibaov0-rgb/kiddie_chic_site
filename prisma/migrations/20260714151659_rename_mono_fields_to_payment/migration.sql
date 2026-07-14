/*
  Warnings:

  - You are about to drop the column `monoInvoiceId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `monoPaidAt` on the `Order` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "monoInvoiceId",
DROP COLUMN "monoPaidAt",
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentInvoiceId" TEXT;
