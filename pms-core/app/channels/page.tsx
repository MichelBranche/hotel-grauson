import { requirePermission } from "@pms-core/auth/guards";

export default async function ChannelsPage() {
  await requirePermission("settings.read");
  return (
    <div className="pms-card max-w-2xl p-6">
      <h1 className="font-[family-name:var(--font-sora)] text-2xl">Canali OTA</h1>
      <p className="mt-3 text-sm leading-6 text-[var(--pms-muted)]">
        Il database è già predisposto per Channel, ChannelConnection, ChannelRoomMapping, ChannelRateMapping e ChannelReservation.
        Il channel manager non è attivo in questa V1: Booking.com, Expedia e Airbnb non sono collegati.
      </p>
    </div>
  );
}
