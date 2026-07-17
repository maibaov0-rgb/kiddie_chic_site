-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AccessoryType" ADD VALUE 'bowTrain';
ALTER TYPE "AccessoryType" ADD VALUE 'dressBow';
ALTER TYPE "AccessoryType" ADD VALUE 'basqueTrain';
ALTER TYPE "AccessoryType" ADD VALUE 'slipperTies';
ALTER TYPE "AccessoryType" ADD VALUE 'sleeves';
ALTER TYPE "AccessoryType" ADD VALUE 'wristbandSet2';
ALTER TYPE "AccessoryType" ADD VALUE 'dressBowSet2';
ALTER TYPE "AccessoryType" ADD VALUE 'skirt';
