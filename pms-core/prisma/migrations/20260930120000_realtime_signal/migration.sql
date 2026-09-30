-- CreateTable
CREATE TABLE "RealtimeSignal" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityId" TEXT,
    "notificationType" TEXT,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RealtimeSignal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RealtimeSignal_propertyId_createdAt_idx" ON "RealtimeSignal"("propertyId", "createdAt");

-- AddForeignKey
ALTER TABLE "RealtimeSignal" ADD CONSTRAINT "RealtimeSignal_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
