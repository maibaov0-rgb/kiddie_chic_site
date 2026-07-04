-- Remove fabric column from ProductVariant (fabric info moved to product description)
ALTER TABLE "ProductVariant" DROP COLUMN "fabric";
