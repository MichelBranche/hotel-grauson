import type Stripe from "stripe";

import { prisma } from "@pms-core/database/client";
import { depositCents } from "@pms-core/lib/deposit";
import { DomainError } from "@pms-core/lib/errors";
import { appBaseUrl, stripeClient } from "@pms-core/lib/stripe";
import { auditService } from "@pms-core/services/audit.service";

function paymentIntentId(session: Stripe.Checkout.Session) {
  if (!session.payment_intent) return null;
  return typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent.id;
}

export async function startCheckout(input: {
  reservationId: string;
  propertyId: string;
  code: string;
  total: number;
  ratePlanId: string | null;
  email?: string | null;
  checkIn: string;
  checkOut: string;
}) {
  const plan = input.ratePlanId
    ? await prisma.ratePlan.findUnique({
        where: { id: input.ratePlanId },
        select: { depositPercent: true },
      })
    : null;
  const cents = depositCents(input.total, plan?.depositPercent);
  const amount = cents / 100;
  const partial = Boolean(plan?.depositPercent && plan.depositPercent > 0 && plan.depositPercent < 100);

  let sessionUrl: string | null = null;
  try {
    if (cents < 50) {
      throw new DomainError("L'importo dell'acconto è troppo basso per il pagamento online.");
    }
    const payment = await prisma.payment.create({
      data: {
        reservationId: input.reservationId,
        amount,
        currency: "EUR",
        method: "ONLINE",
        status: "PENDING",
        note: "Acconto Stripe Checkout",
      },
    });

    const base = appBaseUrl();
    const session = await stripeClient().checkout.sessions.create({
      mode: "payment",
      locale: "it",
      customer_email: input.email || undefined,
      client_reference_id: input.reservationId,
      metadata: {
        reservationId: input.reservationId,
        propertyId: input.propertyId,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: cents,
            product_data: {
              name: partial ? `Acconto soggiorno ${input.code}` : `Soggiorno ${input.code}`,
              description: `${input.checkIn} → ${input.checkOut}`,
            },
          },
        },
      ],
      success_url: `${base}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/booking?checkout=cancelled`,
    });

    if (!session.url) {
      throw new DomainError("Non riusciamo ad aprire il pagamento. Riprovate o chiamate la locanda.");
    }
    sessionUrl = session.url;

    try {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { transactionId: session.id },
      });
    } catch (error) {
      console.error("Checkout opened, but the session id was not stored on the payment.", error);
    }

    return { checkoutUrl: session.url, depositAmount: amount };
  } catch (error) {
    if (!sessionUrl) {
      await prisma.reservation.delete({ where: { id: input.reservationId } }).catch((cleanupError) => {
        console.error("Could not remove a booking hold after Checkout failed to open.", cleanupError);
      });
    }
    throw error;
  }
}

export function constructStripeEvent(payload: string, signature: string) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set.");
    throw new Error("STRIPE_WEBHOOK_SECRET missing");
  }
  return stripeClient().webhooks.constructEvent(payload, signature, secret);
}

/**
 * Marks the online deposit COMPLETED and the hold CONFIRMED.
 * A second delivery of the same session does not create another payment.
 */
export async function completeCheckoutSession(session: Stripe.Checkout.Session) {
  const reservationId = session.metadata?.reservationId;
  const propertyId = session.metadata?.propertyId;
  if (!reservationId) throw new DomainError("Pagamento senza prenotazione.");

  const reservation = await prisma.reservation.findFirst({
    where: { id: reservationId, ...(propertyId ? { propertyId } : {}) },
    include: { payments: true },
  });
  if (!reservation) throw new DomainError("Prenotazione non trovata.");

  if (session.payment_status !== "paid") {
    return { confirmed: false, pending: true, code: reservation.code };
  }

  const intentId = paymentIntentId(session);
  const transactionId = intentId ?? session.id;
  const online = reservation.payments.filter((item) => item.method === "ONLINE");
  const payment =
    online.find((item) => item.transactionId === session.id || item.transactionId === transactionId) ??
    online.find((item) => item.status === "PENDING") ??
    online[0];
  if (!payment) throw new DomainError("Pagamento non trovato.");

  if (payment.status === "COMPLETED") {
    if (reservation.status === "OPTION") {
      await prisma.reservation.updateMany({
        where: { id: reservation.id, status: "OPTION" },
        data: { status: "CONFIRMED" },
      });
    }
    return { confirmed: true, pending: false, code: reservation.code };
  }

  const completed = await prisma.$transaction(async (tx) => {
    const updated = await tx.payment.updateMany({
      where: { id: payment.id, status: "PENDING" },
      data: { status: "COMPLETED", transactionId },
    });
    if (updated.count === 0) {
      const current = await tx.payment.findUnique({ where: { id: payment.id }, select: { status: true } });
      return current?.status === "COMPLETED";
    }
    if (reservation.status === "OPTION") {
      await tx.reservation.updateMany({
        where: { id: reservation.id, status: "OPTION" },
        data: { status: "CONFIRMED" },
      });
    }
    await auditService.record({
      tx,
      propertyId: reservation.propertyId,
      action: "payment.complete",
      entity: "Payment",
      entityId: payment.id,
      after: { status: "COMPLETED", transactionId, reservationId: reservation.id },
    });
    return true;
  });

  return { confirmed: completed, pending: !completed, code: reservation.code };
}
