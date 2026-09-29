import { revalidatePath } from "next/cache";
import Stripe from "stripe";

import { completeCheckoutSession, constructStripeEvent } from "@pms-core/services/checkout.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Firma mancante.", { status: 400 });

  let event: Stripe.Event;
  try {
    event = constructStripeEvent(payload, signature);
  } catch (error) {
    if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
      return new Response("Firma non valida.", { status: 400 });
    }
    console.error("Stripe webhook could not be verified.", error);
    return new Response("Webhook non configurato.", { status: 500 });
  }

  if (event.type === "checkout.session.completed") {
    try {
      const result = await completeCheckoutSession(event.data.object);
      if (!result.pending) revalidatePath("/pms", "layout");
    } catch (error) {
      console.error("Stripe checkout completion failed.", error);
      return new Response("Errore interno.", { status: 500 });
    }
  }

  return new Response("ok", { status: 200 });
}
