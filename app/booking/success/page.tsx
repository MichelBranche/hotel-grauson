import { PageShell } from "@/components/layout/PageShell";
import { hotel } from "@/lib/content";
import { pageMetadata } from "@/lib/site";
import { completeCheckoutSession } from "@pms-core/services/checkout.service";
import { stripeClient } from "@pms-core/lib/stripe";

export const metadata = pageMetadata({
  title: "Pagamento",
  description: "Esito del pagamento dell'acconto per un soggiorno alla Locanda Grauson.",
  path: "/booking/success",
  index: false,
});

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;
  const outcome = await readCheckout(sessionId);

  return (
    <PageShell navOnPaper>
      <section className="shell py-16 sm:py-24">
        <div className="max-w-[40rem] rounded-[var(--radius-panel)] border border-[rgb(37_39_33_/_0.06)] bg-surface px-6 py-10 shadow-[var(--shadow-soft)] sm:px-10 sm:py-14">
          <p className="eyebrow text-muted">{outcome.eyebrow}</p>
          <h1 className="display-lg mt-4 max-w-[16ch]">{outcome.title}</h1>
          <p className="lede mt-5 max-w-[36ch]">{outcome.body}</p>
          <p className="mt-8 text-[0.875rem] text-muted">
            Per qualsiasi cosa, {hotel.phone} · {hotel.email}
          </p>
        </div>
      </section>
    </PageShell>
  );
}

async function readCheckout(sessionId: string | undefined) {
  if (!sessionId) {
    return {
      eyebrow: "Pagamento",
      title: "Stiamo confermando il pagamento",
      body: "Manca il riferimento del pagamento. Se l'addebito è andato a buon fine, la reception lo vede a breve.",
    };
  }

  try {
    const session = await stripeClient().checkout.sessions.retrieve(sessionId);
    const result = await completeCheckoutSession(session);
    if (result.confirmed && result.code) {
      return {
        eyebrow: "Pagamento ricevuto",
        title: "Il soggiorno è confermato",
        body: `Codice ${result.code}. L'acconto è stato registrato.`,
      };
    }
    return {
      eyebrow: "Pagamento",
      title: "Stiamo confermando il pagamento",
      body: result.code
        ? `Codice ${result.code}. Se avete appena pagato, la conferma arriva tra poco. La camera non è ancora confermata.`
        : "Se avete appena pagato, la conferma arriva tra poco. La camera non è ancora confermata.",
    };
  } catch (error) {
    console.error("Checkout success page could not verify the session.", error);
    return {
      eyebrow: "Pagamento",
      title: "Stiamo confermando il pagamento",
      body: "Non riusciamo a leggere l'esito in questo momento. Se l'addebito è andato a buon fine, la reception lo vede a breve.",
    };
  }
}
