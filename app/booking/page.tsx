import { PageShell } from "@/components/layout/PageShell";
import { BookingWizard } from "@pms-core/integrations/booking-engine/ui/booking-wizard";

export const metadata = {
  title: "Prenota",
};

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkIn?: string; checkOut?: string; adults?: string; guests?: string }>;
}) {
  const params = await searchParams;
  return (
    <PageShell>
      <div className="shell py-16">
        <BookingWizard
          checkIn={params.checkIn}
          checkOut={params.checkOut}
          adults={Number(params.adults ?? params.guests ?? 2)}
        />
      </div>
    </PageShell>
  );
}
