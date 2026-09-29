import { PaymentChoice } from "@/components/booking/PaymentChoice";
import { PageShell } from "@/components/layout/PageShell";
import { hotel } from "@/lib/content";
import { pageMetadata } from "@/lib/site";
import { publicBookingByCode } from "@pms-core/services/checkout.service";

export const metadata = pageMetadata({
  title: "Pagamento",
  description: "Scegliete se pagare il soggiorno in locanda o con carta.",
  path: "/booking/pagamento",
  index: false,
});

export default async function BookingPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const booking = code ? await publicBookingByCode(code) : null;

  return (
    <PageShell navOnPaper>
      <section className="shell py-16 sm:py-24">
        {booking && (booking.status === "OPTION" || booking.status === "CONFIRMED") ? (
          <PaymentChoice
            code={booking.code}
            status={booking.status}
            roomTypeName={booking.roomTypeName}
            checkIn={booking.checkIn}
            checkOut={booking.checkOut}
            total={booking.total}
            depositAmount={booking.depositAmount}
            depositPercent={booking.depositPercent}
            paidOnline={booking.paidOnline}
            payAtProperty={booking.payAtProperty}
          />
        ) : (
          <div className="max-w-[40rem] rounded-[var(--radius-panel)] border border-[rgb(37_39_33_/_0.06)] bg-surface px-6 py-10 shadow-[var(--shadow-soft)] sm:px-10">
            <h1 className="display-lg max-w-[16ch]">Prenotazione non trovata</h1>
            <p className="lede mt-5 max-w-[36ch]">
              Il codice non corrisponde a un soggiorno in attesa. Potete rifare la richiesta, o chiamare {hotel.phone}.
            </p>
          </div>
        )}
      </section>
    </PageShell>
  );
}
