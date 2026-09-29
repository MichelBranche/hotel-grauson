import { hotel } from "@/lib/content";
import type { ContactFields } from "@/lib/contact-request";
import { formatRange } from "@pms-core/lib/dates";

const SEND_FAILED = "Non riusciamo a inviare la richiesta. Riprovate, o chiamate la locanda.";

export function contactEmail(data: ContactFields) {
  const dates =
    data.checkIn && data.checkOut ? formatRange(data.checkIn, data.checkOut) : "non indicate";
  const phone = data.phone || "non indicato";
  const subject = `Richiesta dal sito — ${data.firstName} ${data.lastName}`;
  const text = [
    "Richiesta di informazioni o disponibilità dal sito.",
    "Non è una prenotazione e non c'è un pagamento.",
    "",
    `Nome: ${data.firstName} ${data.lastName}`,
    `Email: ${data.email}`,
    `Telefono: ${phone}`,
    `Date: ${dates}`,
    "",
    data.message,
  ].join("\n");
  const html = `<p>Richiesta di informazioni o disponibilità dal sito.</p>
<p>Non è una prenotazione e non c'è un pagamento.</p>
<p><strong>${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)}</strong><br>
Email: ${escapeHtml(data.email)}<br>
Telefono: ${escapeHtml(phone)}<br>
Date: ${escapeHtml(dates)}</p>
<p>${escapeHtml(data.message).replaceAll("\n", "<br>")}</p>`;
  return { subject, text, html };
}

export async function sendContactEmail(data: ContactFields) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return {
      ok: false as const,
      error: "L'invio non è ancora attivo. Chiamate la locanda, vi rispondiamo al telefono.",
    };
  }

  const to = process.env.CONTACT_TO?.trim() || hotel.email;
  const from = process.env.CONTACT_FROM?.trim() || "Locanda Grauson <onboarding@resend.dev>";
  const { subject, text, html } = contactEmail(data);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: data.email,
        subject,
        text,
        html,
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) {
      const detail = await response.text();
      console.error("Contact email was not accepted.", response.status, detail.slice(0, 500));
      return { ok: false as const, error: SEND_FAILED };
    }
    return { ok: true as const };
  } catch (error) {
    console.error("Contact email failed.", error);
    return { ok: false as const, error: SEND_FAILED };
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
