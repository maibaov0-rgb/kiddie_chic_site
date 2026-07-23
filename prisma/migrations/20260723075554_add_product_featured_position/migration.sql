-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "featuredPosition" INTEGER;

-- CreateIndex
CREATE INDEX "Product_category_featuredPosition_idx" ON "Product"("category", "featuredPosition");
