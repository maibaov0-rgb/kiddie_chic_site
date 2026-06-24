-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('cod', 'card');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "ref" TEXT;
ALTER TABLE "Order" ADD COLUMN "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'cod';

-- Update existing rows: generate a ref for any existing orders
UPDATE "Order" SET "ref" = 'KC-' || upper(to_char(extract(epoch from "createdAt") * 1000, 'FM000000000000')) WHERE "ref" IS NULL;

-- Make ref not null
ALTER TABLE "Order" ALTER COLUMN "ref" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Order_ref_key" ON "Order"("ref");

-- CreateIndex  
CREATE INDEX "Order_ref_idx" ON "Order"("ref");
