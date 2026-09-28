import { nightsBetween } from "@pms-core/lib/dates";

export function nightLabel(checkIn: string, checkOut: string): string {
  if (checkIn.length < 10 || checkOut.length < 10 || checkOut <= checkIn) return "Date da completare";
  const nights = nightsBetween(checkIn, checkOut);
  if (nights === 1) return "1 notte";
  return `${nights} notti`;
}

export function guestLabel(adults: number, children: number): string {
  const adultsLabel = adults === 1 ? "1 adulto" : `${adults} adulti`;
  if (children <= 0) return adultsLabel;
  const childrenLabel = children === 1 ? "1 bambino" : `${children} bambini`;
  return `${adultsLabel}, ${childrenLabel}`;
}
