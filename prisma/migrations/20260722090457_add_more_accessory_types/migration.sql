-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AccessoryType" ADD VALUE 'hairBows5';
ALTER TYPE "AccessoryType" ADD VALUE 'headbandButterfly';
ALTER TYPE "AccessoryType" ADD VALUE 'headbandFlower';
ALTER TYPE "AccessoryType" ADD VALUE 'hairBowMedium';
ALTER TYPE "AccessoryType" ADD VALUE 'hairBowLarge';
ALTER TYPE "AccessoryType" ADD VALUE 'headbandPlain';
ALTER TYPE "AccessoryType" ADD VALUE 'glovesWithBows';
ALTER TYPE "AccessoryType" ADD VALUE 'glovesPlain';
ALTER TYPE "AccessoryType" ADD VALUE 'handBows';
