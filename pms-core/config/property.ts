export const propertyConfig = {
  organizationName: "Locanda Grauson",
  organizationSlug: "grauson",
  propertyName: "Hotel Locanda Grauson",
  propertySlug: "grauson",
  logo: null as string | null,
  address: "Frazione Gimillan",
  city: "Cogne",
  postalCode: "11012",
  country: "Italy",
  timezone: "Europe/Rome",
  currency: "EUR",
  language: "it",
  settings: {
    taxRate: 0.1,
    checkInTime: "15:00",
    checkOutTime: "10:00",
    reservationPrefix: "BK",
    defaultAdults: 2,
    childrenMaxAge: 12,
  },
} as const;

export type PropertyConfig = typeof propertyConfig;
