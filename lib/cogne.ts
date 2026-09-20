import { hotel } from "@/lib/content";

export const cogneOffice = {
  name: "Ufficio del Turismo Cogne",
  street: "Rue Bourgeois 34",
  city: "Cogne",
  phone: "+39 0165 74040",
  phoneHref: "tel:+39016574040",
  email: "granparadiso@turismo.vda.it",
  site: "https://www.lovevda.it/",
  park: "https://www.pngp.it/visita-il-parco/sentieri-ed-escursioni/escursioni/valle-di-cogne",
  walksPdf:
    "https://www.visitcogne.it/wp-content/uploads/2024/07/Passeggiate-facili-Cogne-STAMBECCO-2024_compressed.pdf",
} as const;

export type ValleyId = "grauson" | "valnontey" | "valeille" | "paese";

export const valleys: {
  id: ValleyId;
  name: string;
  short: string;
  line: string;
}[] = [
  {
    id: "grauson",
    name: "Vallone del Grauson",
    short: "Grauson",
    line: "Accesso al Vallone del Grauson da Gimillan.",
  },
  {
    id: "paese",
    name: "Cogne",
    short: "Cogne",
    line: "Cogne: circa 20 minuti a piedi. Piazza e Centro visitatori del Parco.",
  },
  {
    id: "valnontey",
    name: "Valnontey",
    short: "Valnontey",
    line: "Valnontey: giardino botanico Paradisia e accesso al Gran Paradiso.",
  },
  {
    id: "valeille",
    name: "Valeille",
    short: "Valeille",
    line: "Valeille: cascate di Lillaz e vallone.",
  },
];

/** Territory the house names — not a catalogue, not a price list. */
export const around = [
  {
    kicker: "Estate",
    title: "Escursioni estive",
    body: "Dal Vallone del Grauson si raggiungono i laghi. In quota: Emilius e Tersiva. Le traversate collegano il Gran Paradiso al Mont Avic.",
  },
  {
    kicker: "Inverno",
    title: "Sci di fondo e inverno",
    body: "A Cogne: 70 km di piste da fondo, sci alpino, itinerari a piedi, con racchette da neve o a cavallo.",
  },
  {
    kicker: "Il paese",
    title: "Siti e servizi",
    body: "Cascate di Lillaz. Miniere di Colonna e Licone. In piazza, il Centro visitatori del Parco (fauna: stambecchi, camosci, aquile) e i servizi del paese.",
  },
] as const;

export type TrailGrade = "T" | "E" | "T/E";

export type Trail = {
  id: string;
  index: string;
  blaze: string;
  name: string;
  from: string;
  to: string;
  startAlt: string;
  endAlt: string;
  gain: string;
  time: string;
  grade: TrailGrade;
  valley: ValleyId;
  fromHouse?: boolean;
  loop?: boolean;
  body: string;
};

/** Official easy walks from the Cogne tourist office, 2024. Not a guidebook. */
export const trails: Trail[] = [
  {
    id: "promenade",
    index: "01",
    blaze: "4",
    name: "Promenade Gimillan 270°",
    from: "Gimillan",
    to: "Gimillan",
    startAlt: "1.775 m",
    endAlt: "1.775 m",
    gain: "+71 m",
    time: "1h02",
    grade: "T",
    valley: "grauson",
    fromHouse: true,
    loop: true,
    body: "Anello sulla balconata di Gimillan. Panorama su Monte Bianco, Grivola e Gran Paradiso. Partenza dal villaggio.",
  },
  {
    id: "cretetta",
    index: "02",
    blaze: "8",
    name: "Pian della Cretetta",
    from: "Gimillan",
    to: "Pian della Cretetta",
    startAlt: "1.804 m",
    endAlt: "1.981 m",
    gain: "+177 m",
    time: "0h38",
    grade: "E",
    valley: "grauson",
    fromHouse: true,
    body: "Poderale a nord-est di Gimillan, con fontana e prati. Vista sul Gran Paradiso.",
  },
  {
    id: "pila",
    index: "03",
    blaze: "8 · 8F",
    name: "Cascate di Pila",
    from: "Gimillan",
    to: "Cascate di Pila",
    startAlt: "1.804 m",
    endAlt: "2.033 m",
    gain: "+255 m",
    time: "1h08",
    grade: "E",
    valley: "grauson",
    fromHouse: true,
    body: "Vallone del Grauson: oratorio della Madonna di Révènti, poi le cascate sotto la parete.",
  },
  {
    id: "cogne-gimillan",
    index: "04",
    blaze: "6",
    name: "Cogne — Gimillan",
    from: "Cogne, Moline",
    to: "Gimillan",
    startAlt: "1.541 m",
    endAlt: "1.771 m",
    gain: "+230 m",
    time: "0h43",
    grade: "E",
    valley: "paese",
    body: "Collegamento a piedi tra Cogne (Moline) e Gimillan. Dislivello +230 m, circa 43 minuti.",
  },
  {
    id: "valnontey",
    index: "05",
    blaze: "23",
    name: "Cogne — Valnontey",
    from: "Cogne",
    to: "Valnontey",
    startAlt: "1.540 m",
    endAlt: "1.662 m",
    gain: "+127 m",
    time: "0h53",
    grade: "T",
    valley: "valnontey",
    body: "Da Cogne a Valnontey via Prati di Sant’Orso. A destinazione: giardino botanico Paradisia.",
  },
  {
    id: "lillaz",
    index: "06",
    blaze: "13 · 13L",
    name: "Cascate di Lillaz",
    from: "Lillaz",
    to: "Lillaz",
    startAlt: "1.610 m",
    endAlt: "1.610 m",
    gain: "+100 m",
    time: "1h15",
    grade: "T/E",
    valley: "valeille",
    loop: true,
    body: "Anello alle cascate di Lillaz: tre salti, circa 150 m di dislivello d’acqua. Il tratto fino alla base è turistico; oltre, il sentiero è più impegnativo.",
  },
];

export const gradeLabel: Record<TrailGrade, string> = {
  T: "Turistico",
  E: "Escursionistico",
  "T/E": "Turistico / escursionistico",
};

export const osmEmbed = `https://www.openstreetmap.org/export/embed.html?bbox=7.302%2C45.562%2C7.422%2C45.638&layer=mapnik&marker=${hotel.geo.lat}%2C${hotel.geo.lng}`;

export const osmLink = `https://www.openstreetmap.org/?mlat=${hotel.geo.lat}&mlon=${hotel.geo.lng}#map=13/${hotel.geo.lat}/${hotel.geo.lng}`;

export const hikingLink = "https://hiking.waymarkedtrails.org/#?map=13/45.608/7.356";
