import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function fullName(firstName: string, lastName: string) {
  return `${lastName} ${firstName}`.trim();
}

export function guestDisplay(firstName: string, lastName: string) {
  return `${lastName} ${firstName}`.trim();
}
