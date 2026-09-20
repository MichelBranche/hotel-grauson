import { PageShell } from "@/components/layout/PageShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { hotel } from "@/lib/content";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/site";

const description =
  "Informativa sulla privacy della Locanda Grauson: quali dati raccogliamo, perché, e come contattarci.";

export const metadata = pageMetadata({
  title: "Privacy",
  description,
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <PageShell navOnPaper footerCompact>
      <JsonLd
        id="privacy-breadcrumb"
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Privacy", path: "/privacy" },
        ])}
      />

      <article className="shell pt-28 pb-20 sm:pt-32">
        <p className="eyebrow text-muted">Note</p>
        <h1 className="display-lg mt-4 max-w-[16ch]">Privacy e cookie</h1>
        <p className="lede mt-6 max-w-[40rem]">
          Titolare del trattamento è {hotel.name}, {hotel.address.street}, {hotel.address.postalCode}{" "}
          {hotel.address.city}. Per domande:{" "}
          <a href={`mailto:${hotel.email}`} className="underline underline-offset-4">
            {hotel.email}
          </a>
          .
        </p>

        <div className="mt-12 grid max-w-[42rem] gap-10 text-[0.95rem] leading-[1.65]">
          <section>
            <h2 className="display-sm">Dati che ci mandate</h2>
            <p className="mt-3 text-ink/80">
              Telefono, posta e il modulo di prenotazione servono a rispondere e a confermare un
              soggiorno o un tavolo. Non vendiamo questi dati e non li usiamo per profilazione.
            </p>
          </section>

          <section id="cookie">
            <h2 className="display-sm">Cookie</h2>
            <p className="mt-3 text-ink/80">
              Il sito pubblico non usa cookie di profilazione. Restano i cookie tecnici necessari
              all&apos;accesso dell&apos;area di lavoro interna, se la usate.
            </p>
          </section>

          <section>
            <h2 className="display-sm">Conservazione</h2>
            <p className="mt-3 text-ink/80">
              I recapiti di una richiesta restano il tempo necessario a gestire il soggiorno e gli
              obblighi di legge. Potete chiedere accesso, correzione o cancellazione scrivendo a{" "}
              {hotel.email}.
            </p>
          </section>

          <section id="credits">
            <h2 className="display-sm">Credits</h2>
            <p className="mt-3 text-ink/80">
              Sito e design:{" "}
              <a
                href="https://www.michelbranche.it"
                target="_blank"
                rel="noreferrer noopener"
                className="underline underline-offset-4"
              >
                Michel Branche
              </a>
              . Fotografie della casa e della valle.
            </p>
          </section>

          <p className="text-sm text-muted">
            Informativa resa ai sensi del Regolamento (UE) 2016/679. Ultimo aggiornamento: settembre
            2026.
          </p>
        </div>
      </article>
    </PageShell>
  );
}
