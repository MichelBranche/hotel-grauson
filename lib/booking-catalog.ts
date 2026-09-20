import { rooms, type RoomMedia } from "@/lib/rooms";

export type BookingTypeCard = {
  label: string;
  promise: string;
  href: string;
  image: RoomMedia;
};

function fromRoom(slug: string, label?: string): BookingTypeCard {
  const room = rooms.find((item) => item.slug === slug);
  if (!room) {
    return {
      label: label ?? "Camera",
      promise: "Bagno privato · Wi-Fi",
      href: "/camere",
      image: {
        src: "/images/camera-famiglia.jpg",
        alt: "Camera in legno della Locanda Grauson, con il letto a fiori e la luce del bosco",
      },
    };
  }

  return {
    label: label ?? room.name,
    promise: room.promise,
    href: `/camere/${room.slug}`,
    image: room.image,
  };
}

export function catalogForType(name: string): BookingTypeCard {
  const key = name.trim().toLowerCase();
  if (key.includes("family")) return fromRoom("standard", "Camera family");
  if (key.includes("junior")) return fromRoom("doppia-economy", "Junior suite");
  if (key.includes("suite")) return fromRoom("standard", "Suite");
  if (key.includes("deluxe")) return fromRoom("matrimoniale", "Camera deluxe");
  if (key.includes("superior")) return fromRoom("tripla", "Camera superior");
  if (key.includes("standard")) return fromRoom("matrimoniale", "Camera standard");
  return fromRoom("matrimoniale", name.startsWith("Camera") ? name : `Camera ${name.toLowerCase()}`);
}

export function rateLabel(name: string) {
  if (/best available/i.test(name)) return "Tariffa della casa";
  return name;
}

export function preferRate<T extends { name: string; refundable: boolean }>(plans: T[]) {
  return (
    plans.find((plan) => /best|casa|flessibile/i.test(plan.name)) ??
    plans.find((plan) => plan.refundable) ??
    plans[0]
  );
}
