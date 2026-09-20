import { ContactArrive } from "@/components/contact/ContactArrive";
import { ContactMap } from "@/components/contact/ContactMap";
import { ContactRecapiti } from "@/components/contact/ContactRecapiti";
import { ContactWrite } from "@/components/contact/ContactWrite";
import { PageHero } from "@/components/hero/PageHero";
import { PageShell } from "@/components/layout/PageShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { contactGooglePlace } from "@/lib/contact";
import { hotel } from "@/lib/content";
import { absUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/site";

const description =
  "Telefono, posta e carta della Locanda Grauson a Gimillan di Cogne. Come arrivare da Aosta.";

export const metadata = pageMetadata({
  title: "Contatti",
  description,
  path: "/contatti",
});

const contactSchema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: `Contatti — ${hotel.name}`,
  description,
  url: absUrl("/contatti"),
  mainEntity: {
    "@id": absUrl("/#hotel"),
    telephone: hotel.phone,
    email: hotel.email,
    hasMap: contactGooglePlace,
  },
};

export default function ContattiPage() {
  return (
    <PageShell>
      <JsonLd id="contatti-schema" data={contactSchema} />
      <JsonLd
        id="contatti-breadcrumb"
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Contatti", path: "/contatti" },
        ])}
      />

      <PageHero
        eyebrow={`Contatti · ${hotel.hamlet}`}
        title={["La casa", "è a Gimillan"]}
        lede="Si chiama, si scrive, si arriva dalla strada di Cogne. Il villaggio è a 1.800 metri."
        note={"1.800 m"}
        media={{ seasonal: "facciata" }}
        detail={`${hotel.address.street} · ${hotel.address.city}`}
      />

      <ContactRecapiti />
      <ContactMap />
      <ContactArrive />
      <ContactWrite />
    </PageShell>
  );
}
