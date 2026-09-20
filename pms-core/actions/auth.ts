"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { rateLimit } from "@pms-core/auth/rate-limit";
import { verifyPassword } from "@pms-core/auth/password";
import { sessionCookieOptions, signSession, SESSION_COOKIE } from "@pms-core/auth/session";
import { prisma } from "@pms-core/database/client";
import { wrapAction } from "@pms-core/actions/result";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(3, "Inserisci un indirizzo email valido.")
    .refine((value) => value.includes("@"), "Inserisci un indirizzo email valido."),
  password: z.string().min(8, "La password deve contenere almeno 8 caratteri."),
});

export async function loginAction(input: { email: string; password: string }) {
  return wrapAction(async () => {
    const parsed = loginSchema.parse(input);
    const ip = (await headers()).get("x-forwarded-for") ?? "local";
    const limited = rateLimit(`login:${ip}:${parsed.email}`, 8, 10 * 60 * 1000);
    if (!limited.ok) {
      throw new Error("Troppi tentativi di accesso. Riprova tra qualche minuto.");
    }

    const user = await prisma.user.findUnique({ where: { email: parsed.email.toLowerCase() } });
    if (!user || !user.active) throw new Error("Credenziali non valide.");
    const valid = await verifyPassword(parsed.password, user.passwordHash);
    if (!valid) throw new Error("Credenziali non valide.");
    if (!user.propertyId) throw new Error("Utente non associato a una struttura.");

    const token = await signSession({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      propertyId: user.propertyId,
      organizationId: user.organizationId,
    });

    try {
      await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    } catch {
      // Read-only demo snapshots should still sign in.
    }
    const jar = await cookies();
    const options = sessionCookieOptions();
    jar.set(options.name, token, options);
    return { redirectTo: "/pms/planning" };
  });
}

export async function logoutAction() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/pms/login");
}
