import type Stripe from "stripe";

import { prisma } from "@pms-core/database/client";
import { defaultPropertyId } from "@pms-core/integrations/booking-engine";
import { depositCents, depositEuros, chargedDepositPercent } from "@pms-core/lib/deposit";
import { toISODate } from "@pms-core/lib/dates";
import { DomainError } from "@pms-core/lib/errors";
import { PAY_AT_PROPERTY_NOTE, chosePayAtProperty } from "@pms-core/lib/pay-at-property";
import { appendReservationNote } from "@pms-core/lib/reservation-status";
import { appBaseUrl, stripeClient } from "@pms-core/lib/stripe";
import { auditService } from "@pms-core/services/audit.service";
import { reservationService } from "@pms-core/services/reservation.service";

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

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("STRIPE_SECRET_KEY is not set.");
    throw new DomainError("Pagamento online non ancora disponibile");
  }

  let sessionUrl: string | null = null;
  try {
    if (cents < 50) {
      throw new DomainError("Pagamento online non ancora disponibile");
    }
    await prisma.payment.deleteMany({
      where: { reservationId: input.reservationId, method: "ONLINE", status: "PENDING", transactionId: null },
    });
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
      await prisma.payment
        .deleteMany({
          where: { reservationId: input.reservationId, method: "ONLINE", status: "PENDING", transactionId: null },
        })
        .catch((cleanupError) => {
          console.error("Could not remove a card payment that never opened Checkout.", cleanupError);
        });
    }
    throw error;
  }
}

export async function publicBookingByCode(code: string) {
  const trimmed = code.trim();
  if (!trimmed) return null;
  const propertyId = await defaultPropertyId();
  const reservation = await prisma.reservation.findFirst({
    where: { code: trimmed, propertyId, source: "website" },
    include: {
      guest: { select: { email: true } },
      roomType: { select: { name: true } },
      ratePlan: { select: { depositPercent: true } },
      payments: { select: { method: true, status: true } },
    },
  });
  if (!reservation) return null;
  const depositPercent = reservation.ratePlan?.depositPercent ?? 0;
  return {
    id: reservation.id,
    propertyId: reservation.propertyId,
    code: reservation.code,
    status: reservation.status,
    roomTypeName: reservation.roomType.name,
    checkIn: toISODate(reservation.checkIn),
    checkOut: toISODate(reservation.checkOut),
    total: reservation.total,
    ratePlanId: reservation.ratePlanId,
    email: reservation.guest.email,
    depositAmount: depositEuros(reservation.total, depositPercent),
    depositPercent: chargedDepositPercent(depositPercent),
    paidOnline: reservation.payments.some((item) => item.method === "ONLINE" && item.status === "COMPLETED"),
    notes: reservation.notes,
    payAtProperty: chosePayAtProperty(reservation.notes),
  };
}

/** Records pay-at-property on the website hold. Status stays OPTION and no payment is created. */
export async function requestPayAtProperty(code: string) {
  const booking = await publicBookingByCode(code);
  if (!booking) throw new DomainError("Non troviamo questa prenotazione.");
  if (booking.status !== "OPTION") {
    throw new DomainError("Questa prenotazione non è in attesa di conferma.");
  }
  if (!booking.payAtProperty) {
    await reservationService.updateNotes(booking.id, appendReservationNote(booking.notes, PAY_AT_PROPERTY_NOTE), {
      name: "booking-engine",
    });
  }
  return { code: booking.code };
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
