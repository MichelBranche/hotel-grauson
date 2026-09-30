"use client";

import { useState } from "react";

import { loginAction } from "@pms-core/actions/auth";
import { branding } from "@pms-core/config/branding";
import { Button } from "@pms-core/components/ui/button";
import { Field, Input } from "@pms-core/components/ui/input";

function redirectTarget(error: unknown) {
  if (typeof error !== "object" || error === null || !("digest" in error)) return null;
  const digest = String((error as { digest: unknown }).digest);
  if (!digest.startsWith("NEXT_REDIRECT")) return null;
  const target = digest.split(";")[2] ?? "";
  if (!target.startsWith("/pms/") || target.startsWith("//") || target.includes("\\")) return "/pms/planning";
  return target;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={branding.loginImage} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(20_26_21_/_0.35),rgb(15_20_16_/_0.78))]" />
        <div className="relative flex h-full flex-col justify-end p-10 text-[var(--pms-surface)]">
          <p className="text-[11px] tracking-[0.28em] text-white/70">{branding.wordmark[0]}</p>
          <p className="text-5xl font-semibold tracking-[0.02em]">{branding.wordmark[1]}</p>
          <p className="mt-3 text-sm text-white/70">{branding.locationLine}</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-6 py-12">
        <form
          className="w-full max-w-sm"
          onSubmit={async (event) => {
            event.preventDefault();
            setPending(true);
            setError(null);
            try {
              const result = await loginAction({ email, password });
              if (!result.ok) {
                setPending(false);
                setError(result.error);
                return;
              }
              // The session cookie is already set. A soft router.push/refresh
              // stays on this page: Next refreshes the current login route
              // after cookies().set(), and that refresh wins over the push.
              // A full navigation sends the cookie and lands in the PMS.
              window.location.replace(result.data.redirectTo);
            } catch (error) {
              const target = redirectTarget(error);
              if (target) {
                window.location.replace(target);
                return;
              }
              setPending(false);
              setError("Accesso non riuscito. Riprova.");
            }
          }}
        >
          <p className="text-xs tracking-[0.22em] text-[var(--pms-muted)]">PROPERTY MANAGEMENT</p>
          <h1 className="mt-2 text-3xl">Accedi al PMS</h1>
          <p className="mt-2 text-sm text-[var(--pms-muted)]">
            Accedi con l&apos;account owner della struttura.
          </p>
          <div className="mt-8 grid gap-4">
            <Field label="Email">
              <Input type="text" inputMode="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" />
            </Field>
            <Field label="Password">
              <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
            </Field>
          </div>
          {error ? <p className="mt-4 text-sm text-[#8a3b3b]">{error}</p> : null}
          <Button type="submit" className="mt-6 w-full" disabled={pending}>
            {pending ? "Accesso…" : "Entra"}
          </Button>
        </form>
      </div>
    </div>
  );
}
