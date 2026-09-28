/** Classi condivise, così ogni pezzo del modulo assomiglia al resto della locanda. */

export const bookingPanelClass =
  "rounded-[var(--radius-panel)] border border-[rgb(37_39_33_/_0.06)] bg-surface p-5 shadow-[var(--shadow-soft)] sm:p-7";

export const bookingInputClass =
  "mt-1.5 h-12 w-full rounded-[16px] border bg-paper/70 px-3 text-base text-ink outline-none transition-colors duration-300 [color-scheme:light]";

export const bookingInputIdle = "border-[rgb(37_39_33_/_0.08)] focus:border-alpine/40";

export const bookingInputInvalid = "border-[#8a3b3b] focus:border-[#8a3b3b]";

export const bookingErrorClass = "mt-1.5 text-[0.8125rem] leading-snug text-[#8a3b3b]";
