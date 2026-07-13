-- CreateEnum
CREATE TYPE "AccessoryType" AS ENUM ('headband', 'gloves', 'bag', 'choker');

-- CreateTable
CREATE TABLE "ProductAccessory" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "AccessoryType" NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "ProductAccessory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderAccessoryItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "OrderAccessoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductAccessory_productId_type_key" ON "ProductAccessory"("productId", "type");

-- CreateIndex
CREATE INDEX "OrderAccessoryItem_orderId_idx" ON "OrderAccessoryItem"("orderId");

-- AddForeignKey
ALTER TABLE "ProductAccessory" ADD CONSTRAINT "ProductAccessory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderAccessoryItem" ADD CONSTRAINT "OrderAccessoryItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
