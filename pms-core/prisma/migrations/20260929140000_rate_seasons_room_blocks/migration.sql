-- CreateTable
CREATE TABLE "RateSeason" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "ratePlanId" TEXT,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "minStay" INTEGER,
    "maxStay" INTEGER,
    "closedToArrival" BOOLEAN NOT NULL DEFAULT false,
    "closedToDeparture" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateSeason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateSeasonPrice" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "RateSeasonPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomBlock" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RateSeason_propertyId_startDate_endDate_idx" ON "RateSeason"("propertyId", "startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "RateSeasonPrice_seasonId_roomTypeId_key" ON "RateSeasonPrice"("seasonId", "roomTypeId");

-- CreateIndex
CREATE INDEX "RoomBlock_propertyId_startDate_endDate_idx" ON "RoomBlock"("propertyId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "RoomBlock_roomId_startDate_endDate_idx" ON "RoomBlock"("roomId", "startDate", "endDate");

-- AddForeignKey
ALTER TABLE "RateSeason" ADD CONSTRAINT "RateSeason_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateSeason" ADD CONSTRAINT "RateSeason_ratePlanId_fkey" FOREIGN KEY ("ratePlanId") REFERENCES "RatePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateSeasonPrice" ADD CONSTRAINT "RateSeasonPrice_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "RateSeason"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateSeasonPrice" ADD CONSTRAINT "RateSeasonPrice_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomBlock" ADD CONSTRAINT "RoomBlock_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomBlock" ADD CONSTRAINT "RoomBlock_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Same Data API lockdown as init_postgres: RLS on, no policies, anon/authenticated revoked.
DO $$
DECLARE
  t text;
  tables text[] := ARRAY['RateSeason', 'RateSeasonPrice', 'RoomBlock'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      EXECUTE format('REVOKE ALL ON TABLE %I FROM anon', t);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
      EXECUTE format('REVOKE ALL ON TABLE %I FROM authenticated', t);
    END IF;
  END LOOP;
END $$;
