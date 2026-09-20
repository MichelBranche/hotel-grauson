import { hotel } from "@/lib/content";

const { lat, lng } = hotel.geo;

export const contactGoogleEmbed = `https://www.google.com/maps/embed?origin=mfe&pb=!1m3!2m1!1s${lat},${lng}!6i15!3m1!1sit!5m1!1sit`;

export const contactGooglePlace = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

export const contactGoogleDir = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

export const journeys = [
  {
    index: "01",
    title: "In auto",
    body: "A5 Torino–Aosta, uscita Aosta Ovest. Poi la regionale per Cogne, circa mezz’ora. Da Cogne a Gimillan: tre chilometri di salita.",
  },
  {
    index: "02",
    title: "In treno",
    body: "Stazione di Aosta. Corriera per Cogne. Da Cogne si sale in auto, o a piedi in circa tre quarti d’ora.",
  },
  {
    index: "03",
    title: "In inverno",
    body: "Pneumatici da neve o catene, come in tutta la valle. Il parcheggio della casa è privato e gratuito.",
  },
] as const;
