import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";

export function toISODate(value: Date | string): string {
  if (typeof value === "string") return value.slice(0, 10);
  return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`;
}

export function toDate(iso: string): Date {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

export function todayISO(now = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function addDaysISO(iso: string, amount: number): string {
  const date = toDate(iso);
  date.setUTCDate(date.getUTCDate() + amount);
  return toISODate(date);
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.round((toDate(checkOut).getTime() - toDate(checkIn).getTime()) / 86_400_000);
}

export function eachISODate(from: string, to: string): string[] {
  const days: string[] = [];
  for (let cursor = from; cursor < to; cursor = addDaysISO(cursor, 1)) {
    days.push(cursor);
  }
  return days;
}

export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function formatRange(from: string, to: string) {
  return `${format(parseISO(from), "d MMMM", { locale: it })} – ${format(parseISO(to), "d MMMM yyyy", { locale: it })}`;
}

export function formatDayHeading(iso: string) {
  return format(parseISO(iso), "d", { locale: it });
}

export function formatWeekday(iso: string) {
  return format(parseISO(iso), "EEEEEE", { locale: it });
}

export function formatLong(iso: string) {
  return format(parseISO(iso), "d MMMM yyyy", { locale: it });
}

export function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}
