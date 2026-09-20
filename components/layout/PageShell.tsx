import { SiteEffects } from "@/components/effects/SiteEffects";
import { DemoControls } from "@/components/layout/DemoControls";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

export function PageShell({
  children,
  footerPull = false,
}: {
  children: React.ReactNode;
  /** Pull the footer up so the booking bar can pin over the forest band. */
  footerPull?: boolean;
}) {
  return (
    <>
      <a
        href="#contenuto"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[80] focus:rounded-full focus:bg-alpine focus:px-5 focus:py-3 focus:text-[0.8125rem] focus:text-surface"
      >
        Salta al contenuto
      </a>

      <Navbar />

      <main id="contenuto" className="relative">
        {children}
      </main>

      <Footer pull={footerPull} />

      <SiteEffects />

      {/* Demo controls: remove them and the calendar takes over on its own. */}
      <DemoControls />
    </>
  );
}
