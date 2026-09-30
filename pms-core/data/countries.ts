/** ISO-style country list with Italian names. Italy is stored as IT. */
export const COUNTRIES = [
  { code: "IT", name: "Italia" },
  { code: "AF", name: "Afghanistan" },
  { code: "AL", name: "Albania" },
  { code: "DZ", name: "Algeria" },
  { code: "AD", name: "Andorra" },
  { code: "AO", name: "Angola" },
  { code: "SA", name: "Arabia Saudita" },
  { code: "AR", name: "Argentina" },
  { code: "AM", name: "Armenia" },
  { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },
  { code: "AZ", name: "Azerbaigian" },
  { code: "BE", name: "Belgio" },
  { code: "BY", name: "Bielorussia" },
  { code: "BO", name: "Bolivia" },
  { code: "BA", name: "Bosnia ed Erzegovina" },
  { code: "BR", name: "Brasile" },
  { code: "BG", name: "Bulgaria" },
  { code: "CA", name: "Canada" },
  { code: "CL", name: "Cile" },
  { code: "CN", name: "Cina" },
  { code: "CY", name: "Cipro" },
  { code: "CO", name: "Colombia" },
  { code: "KR", name: "Corea del Sud" },
  { code: "CR", name: "Costa Rica" },
  { code: "HR", name: "Croazia" },
  { code: "DK", name: "Danimarca" },
  { code: "EG", name: "Egitto" },
  { code: "AE", name: "Emirati Arabi Uniti" },
  { code: "EC", name: "Ecuador" },
  { code: "EE", name: "Estonia" },
  { code: "ET", name: "Etiopia" },
  { code: "PH", name: "Filippine" },
  { code: "FI", name: "Finlandia" },
  { code: "FR", name: "Francia" },
  { code: "DE", name: "Germania" },
  { code: "JP", name: "Giappone" },
  { code: "GR", name: "Grecia" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "IE", name: "Irlanda" },
  { code: "IS", name: "Islanda" },
  { code: "IL", name: "Israele" },
  { code: "KZ", name: "Kazakistan" },
  { code: "KE", name: "Kenya" },
  { code: "XK", name: "Kosovo" },
  { code: "LV", name: "Lettonia" },
  { code: "LI", name: "Liechtenstein" },
  { code: "LT", name: "Lituania" },
  { code: "LU", name: "Lussemburgo" },
  { code: "MK", name: "Macedonia del Nord" },
  { code: "MY", name: "Malesia" },
  { code: "MT", name: "Malta" },
  { code: "MA", name: "Marocco" },
  { code: "MX", name: "Messico" },
  { code: "MD", name: "Moldavia" },
  { code: "MC", name: "Monaco" },
  { code: "ME", name: "Montenegro" },
  { code: "NO", name: "Norvegia" },
  { code: "NZ", name: "Nuova Zelanda" },
  { code: "NL", name: "Paesi Bassi" },
  { code: "PK", name: "Pakistan" },
  { code: "PE", name: "Perù" },
  { code: "PL", name: "Polonia" },
  { code: "PT", name: "Portogallo" },
  { code: "GB", name: "Regno Unito" },
  { code: "CZ", name: "Cechia" },
  { code: "RO", name: "Romania" },
  { code: "RU", name: "Russia" },
  { code: "SM", name: "San Marino" },
  { code: "SN", name: "Senegal" },
  { code: "RS", name: "Serbia" },
  { code: "SG", name: "Singapore" },
  { code: "SK", name: "Slovacchia" },
  { code: "SI", name: "Slovenia" },
  { code: "ES", name: "Spagna" },
  { code: "US", name: "Stati Uniti" },
  { code: "ZA", name: "Sudafrica" },
  { code: "SE", name: "Svezia" },
  { code: "CH", name: "Svizzera" },
  { code: "TH", name: "Thailandia" },
  { code: "TN", name: "Tunisia" },
  { code: "TR", name: "Turchia" },
  { code: "UA", name: "Ucraina" },
  { code: "HU", name: "Ungheria" },
  { code: "UY", name: "Uruguay" },
  { code: "VA", name: "Vaticano" },
  { code: "VE", name: "Venezuela" },
  { code: "VN", name: "Vietnam" },
] as const;

export type CountryCode = (typeof COUNTRIES)[number]["code"];

export function foldPlace(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/** Italy is always IT. Known names and codes become the ISO code. Unknown text is kept. */
export function normalizeCountry(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const folded = foldPlace(trimmed);
  if (folded === "it" || folded === "ita" || folded === "italia") return "IT";
  const found = COUNTRIES.find((country) => foldPlace(country.code) === folded || foldPlace(country.name) === folded);
  return found?.code ?? trimmed;
}

export function countryLabel(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const code = normalizeCountry(trimmed);
  return COUNTRIES.find((country) => country.code === code)?.name ?? trimmed;
}
