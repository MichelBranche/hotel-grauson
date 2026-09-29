-- CreateTable
CREATE TABLE "Floor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Floor_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Floor_propertyId_name_key" ON "Floor"("propertyId", "name");

-- CreateIndex
CREATE INDEX "Floor_propertyId_sortOrder_idx" ON "Floor"("propertyId", "sortOrder");

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RoomType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL DEFAULT '',
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "capacity" INTEGER NOT NULL,
    "maxAdults" INTEGER NOT NULL DEFAULT 0,
    "maxChildren" INTEGER NOT NULL DEFAULT 0,
    "sizeM2" REAL,
    "beds" TEXT NOT NULL DEFAULT '',
    "bathroom" TEXT NOT NULL DEFAULT '',
    "amenities" TEXT NOT NULL DEFAULT '[]',
    "images" TEXT NOT NULL DEFAULT '[]',
    "basePrice" REAL NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RoomType_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RoomType" ("amenities", "capacity", "createdAt", "description", "id", "images", "name", "propertyId", "slug", "sortOrder", "updatedAt")
SELECT "amenities", "capacity", "createdAt", "description", "id", "images", "name", "propertyId", "slug", "sortOrder", "updatedAt" FROM "RoomType";
UPDATE "new_RoomType" SET "code" = upper("slug"), "maxAdults" = "capacity" WHERE "code" = '';
DROP TABLE "RoomType";
ALTER TABLE "new_RoomType" RENAME TO "RoomType";
CREATE UNIQUE INDEX "RoomType_propertyId_slug_key" ON "RoomType"("propertyId", "slug");
CREATE UNIQUE INDEX "RoomType_propertyId_code_key" ON "RoomType"("propertyId", "code");
CREATE INDEX "RoomType_propertyId_active_idx" ON "RoomType"("propertyId", "active");

CREATE TABLE "new_Room" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    "floorId" TEXT,
    "number" TEXT NOT NULL,
    "name" TEXT,
    "floor" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "beds" TEXT NOT NULL DEFAULT '',
    "amenities" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "notes" TEXT NOT NULL DEFAULT '',
    "customBasePrice" REAL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Room_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Room_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType" ("id") ON UPDATE CASCADE,
    CONSTRAINT "Room_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "Floor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Room" ("amenities", "beds", "capacity", "createdAt", "floor", "id", "name", "notes", "number", "propertyId", "roomTypeId", "sortOrder", "status", "updatedAt")
SELECT "amenities", "beds", "capacity", "createdAt", "floor", "id", "name", "notes", "number", "propertyId", "roomTypeId", "sortOrder", "status", "updatedAt" FROM "Room";
DROP TABLE "Room";
ALTER TABLE "new_Room" RENAME TO "Room";
CREATE UNIQUE INDEX "Room_propertyId_number_key" ON "Room"("propertyId", "number");
CREATE INDEX "Room_propertyId_status_idx" ON "Room"("propertyId", "status");
CREATE INDEX "Room_propertyId_active_idx" ON "Room"("propertyId", "active");
CREATE INDEX "Room_propertyId_floorId_idx" ON "Room"("propertyId", "floorId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
