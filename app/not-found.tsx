import type { Metadata } from "next";
import Link from "next/link";

import { PageShell } from "@/components/layout/PageShell";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Pagina non trovata",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <PageShell navOnPaper footerCompact>
      <section className="shell flex min-h-[70svh] flex-col justify-end pt-28 pb-20 sm:pt-32">
        <p className="eyebrow text-muted">404</p>
        <h1 className="display-lg mt-4 max-w-[12ch]">Questa pagina non c&apos;è</h1>
        <p className="lede mt-6 max-w-[32rem]">
          Il sentiero si interrompe. Tornate in casa, oppure chiedete le camere.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <ButtonLink href="/" size="lg">
            La locanda
          </ButtonLink>
          <Link href="/camere" className="inline-flex h-12 items-center text-sm underline underline-offset-4">
            Le camere
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
