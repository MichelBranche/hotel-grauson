import { PAY_AT_PROPERTY_NOTIFICATION } from "@pms-core/lib/pay-at-property";

export const PMS_SOUND_KEY = "pms-sound";
const HEARD_KEY = "pms-sound-heard";
const CHANGE_EVENT = "pms-sound-change";
const HEARD_LIMIT = 80;

export const WEB_NOTIFICATION_SOUND = "/sounds/notification-web.mp3";
export const CONFIRM_NOTIFICATION_SOUND = "/sounds/notification-confirm.mp3";

export function soundPreferenceOn(stored: string | null) {
  return stored !== "off";
}

type Notice = { id: string; type?: string | null; title: string; read: boolean };

function isWebRequestNotice(item: Notice) {
  return item.type === PAY_AT_PROPERTY_NOTIFICATION || item.title === "Nuova richiesta web";
}

/** Unread web-request notices this browser has not already announced. */
export function unheardWebRequestIds(items: readonly Notice[], heard: readonly string[]) {
  const known = new Set(heard);
  return items.filter((item) => !item.read && !known.has(item.id) && isWebRequestNotice(item)).map((item) => item.id);
}

export function readSoundEnabled() {
  try {
    return soundPreferenceOn(localStorage.getItem(PMS_SOUND_KEY));
  } catch {
    return true;
  }
}

export function subscribeSound(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function writeSoundEnabled(on: boolean) {
  try {
    localStorage.setItem(PMS_SOUND_KEY, on ? "on" : "off");
  } catch {
    return;
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function readHeard(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(HEARD_KEY) ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

function writeHeard(ids: string[]) {
  try {
    localStorage.setItem(HEARD_KEY, JSON.stringify(ids.slice(-HEARD_LIMIT)));
  } catch {
    // Private mode can refuse storage. The sound still plays this once.
  }
}

export function playPmsSound(src: string) {
  if (typeof window === "undefined" || !readSoundEnabled()) return;
  const audio = new Audio(src);
  audio.volume = 0.5;
  void audio.play().catch(() => {});
}

/** One soft ding when a web request first shows in the bell. A reload of the same notice stays quiet. */
export function hearWebRequests(items: readonly Notice[]) {
  if (typeof window === "undefined") return;
  const fresh = unheardWebRequestIds(items, readHeard());
  if (fresh.length === 0) return;
  writeHeard([...readHeard(), ...fresh]);
  playPmsSound(WEB_NOTIFICATION_SOUND);
}
