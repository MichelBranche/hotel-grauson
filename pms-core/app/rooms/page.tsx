import { can } from "@pms-core/config/permissions";
import { requirePermission } from "@pms-core/auth/guards";
import { StructurePage } from "@pms-core/components/rooms/structure-page";
import { parseJson } from "@pms-core/lib/utils";
import { roomService } from "@pms-core/services/room.service";

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requirePermission("rooms.read");
  const { tab } = await searchParams;
  const [rooms, types, floors] = await Promise.all([
    roomService.list(session.propertyId),
    roomService.types(session.propertyId),
    roomService.floors(session.propertyId),
  ]);

  return (
    <StructurePage
      initialTab={tab}
      permissions={{
        rooms: can(session.role, "rooms.write"),
        roomTypes: can(session.role, "roomTypes.write"),
        floors: can(session.role, "floors.write"),
      }}
      rooms={rooms.map((room) => ({
        id: room.id,
        number: room.number,
        name: room.name,
        floor: room.floor,
        floorId: room.floorId,
        floorName: room.assignedFloor?.displayName ?? null,
        capacity: room.capacity,
        status: room.status,
        notes: room.notes,
        active: room.active,
        customBasePrice: room.customBasePrice,
        roomTypeId: room.roomTypeId,
        roomTypeName: room.roomType.name,
        roomTypeCode: room.roomType.code,
        displayPrice: room.customBasePrice ?? room.roomType.basePrice,
      }))}
      types={types.map((type) => ({
        id: type.id,
        name: type.name,
        code: type.code,
        description: type.description,
        capacity: type.capacity,
        maxAdults: type.maxAdults,
        maxChildren: type.maxChildren,
        sizeM2: type.sizeM2,
        beds: type.beds,
        bathroom: type.bathroom,
        amenities: parseJson<string[]>(type.amenities, []),
        images: parseJson<string[]>(type.images, []),
        basePrice: type.basePrice,
        active: type.active,
        sortOrder: type.sortOrder,
        roomCount: type._count.rooms,
      }))}
      floors={floors.map((floor) => ({
        id: floor.id,
        name: floor.name,
        displayName: floor.displayName,
        sortOrder: floor.sortOrder,
        description: floor.description,
        active: floor.active,
        roomCount: floor._count.rooms,
      }))}
    />
  );
}
