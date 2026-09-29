"use server";

import { headers } from "next/headers";

import { readContactRequest, type ContactDraft } from "@/lib/contact-request";
import { sendContactEmail } from "@/lib/contact-mail";
import { rateLimit } from "@pms-core/auth/rate-limit";

export async function submitContactRequestAction(input: ContactDraft & { company?: string }) {
  const header = (await headers()).get("x-forwarded-for") ?? "local";
  const ip = header.split(",")[0]?.trim() || "local";
  const limited = rateLimit(`contact:${ip}`, 6, 60 * 60 * 1000);
  if (!limited.ok) {
    return { ok: false as const, error: "Troppe richieste da questo indirizzo. Riprovate più tardi." };
  }
  if (input.company?.trim()) return { ok: true as const };

  const parsed = readContactRequest(input);
  if (!parsed.ok) return parsed;
  return sendContactEmail(parsed.data);
}
