import Stripe from "stripe";

import { DomainError } from "@pms-core/lib/errors";

let client: Stripe | null = null;

export function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error("STRIPE_SECRET_KEY is not set.");
    throw new DomainError("Il pagamento online non è disponibile in questo momento. Chiamate la locanda.");
  }
  if (!client) client = new Stripe(key);
  return client;
}

/** Absolute site origin for Checkout success and cancel URLs. */
export function appBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  return "http://localhost:3000";
}
