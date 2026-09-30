-- AlterTable
ALTER TABLE "Guest" ADD COLUMN "citizenship" TEXT,
ADD COLUMN "sex" TEXT,
ADD COLUMN "birthPlace" TEXT,
ADD COLUMN "residenceAddress" TEXT,
ADD COLUMN "residencePostalCode" TEXT,
ADD COLUMN "residenceCity" TEXT,
ADD COLUMN "residenceProvince" TEXT,
ADD COLUMN "residenceCountry" TEXT,
ADD COLUMN "documentAuthority" TEXT,
ADD COLUMN "documentIssuedOn" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ReservationGuest" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'GUEST';
