"use client";

import { format } from "date-fns";
import { it } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { addDaysISO, toDate, todayISO } from "@pms-core/lib/dates";
import { cn } from "@pms-core/lib/utils";

export type DatePickerTone = "site" | "pms";

const WEEKDAYS = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"];
const WEEKDAY_NAMES = ["lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato", "domenica"];

const tones = {
  site: {
    trigger:
      "w-full bg-transparent text-left text-[0.8125rem] font-medium text-ink outline-none data-[empty=true]:text-muted",
    content:
      "z-[90] w-[min(20.5rem,calc(100vw-1.5rem))] rounded-[var(--radius-card)] border border-[rgb(37_39_33_/_0.06)] bg-surface p-4 text-ink shadow-[var(--shadow-lift)]",
    title: "text-[0.9375rem] font-medium",
    nav: "grid size-9 place-items-center rounded-full text-ink transition-colors hover:bg-surface-deep disabled:opacity-30 disabled:hover:bg-transparent",
    weekday: "text-[0.6875rem] tracking-[0.08em] text-muted uppercase",
    day: "rounded-full text-[0.8125rem] text-ink transition-colors hover:bg-surface-deep focus-visible:ring-2 focus-visible:ring-accent/40",
    range: "bg-surface-deep",
    selected: "bg-accent text-surface hover:bg-accent-hover",
    today: "font-semibold underline decoration-accent/60 underline-offset-4",
    disabled: "text-muted/45 hover:bg-transparent",
    footer: "text-[0.75rem] text-muted underline decoration-[rgb(37_39_33_/_0.2)] underline-offset-4 hover:text-ink",
  },
  pms: {
    trigger:
      "flex h-10 w-full items-center justify-between gap-2 rounded-2xl border border-[var(--pms-line)] bg-white px-3 text-left text-sm outline-none transition-[border-color,box-shadow] focus-visible:border-[var(--pms-alpine)] focus-visible:shadow-[0_0_0_3px_rgb(38_50_41_/_0.1)] data-[empty=true]:text-[var(--pms-muted)] data-[state=open]:border-[var(--pms-alpine)]",
    content:
      "z-[80] w-[min(19.5rem,calc(100vw-1.5rem))] rounded-[var(--pms-radius)] border border-[var(--pms-line)] bg-[var(--pms-surface)] p-3 text-[var(--pms-text)] shadow-[var(--pms-shadow)]",
    title: "text-sm font-medium",
    nav: "grid size-8 place-items-center rounded-full text-[var(--pms-text)] transition-colors hover:bg-[var(--pms-surface-dark)] disabled:opacity-30 disabled:hover:bg-transparent",
    weekday: "text-[0.6875rem] text-[var(--pms-muted)]",
    day: "rounded-full text-sm tabular-nums text-[var(--pms-text)] transition-colors hover:bg-[var(--pms-hover)] focus-visible:ring-2 focus-visible:ring-[rgb(38_50_41_/_0.25)]",
    range: "bg-[var(--pms-surface-dark)]",
    selected: "bg-[var(--pms-alpine)] text-[var(--pms-surface)] hover:bg-[var(--pms-green-soft)]",
    today: "font-semibold text-[var(--pms-alpine)]",
    disabled: "text-[var(--pms-muted)]/45 hover:bg-transparent",
    footer: "text-xs text-[var(--pms-muted)] hover:text-[var(--pms-text)]",
  },
} as const;

function monthOf(iso: string) {
  return iso.slice(0, 7);
}

function shiftMonth(month: string, amount: number) {
  const [year, value] = month.split("-").map(Number);
  const index = year * 12 + (value - 1) + amount;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

function clampDay(iso: string, month: string) {
  const day = Number(iso.slice(8, 10));
  const last = daysInMonth(month);
  return `${month}-${String(Math.min(day, last)).padStart(2, "0")}`;
}

function daysInMonth(month: string) {
  const [year, value] = month.split("-").map(Number);
  return new Date(Date.UTC(year, value, 0)).getUTCDate();
}

function weekdayIndex(iso: string) {
  return (toDate(iso).getUTCDay() + 6) % 7;
}

function monthWeeks(month: string) {
  const first = `${month}-01`;
  const lead = weekdayIndex(first);
  const cells: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let day = 1; day <= daysInMonth(month); day += 1) {
    cells.push(`${month}-${String(day).padStart(2, "0")}`);
  }
  while (cells.length % 7) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let index = 0; index < cells.length; index += 7) weeks.push(cells.slice(index, index + 7));
  return weeks;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function portalContainer(tone: DatePickerTone) {
  if (tone !== "pms" || typeof document === "undefined") return undefined;
  return document.querySelector<HTMLElement>("[data-pms]") ?? undefined;
}

export function formatPickerDate(iso: string) {
  return format(toDate(iso), "d MMM yyyy", { locale: it });
}

export function DatePicker({
  id,
  value,
  defaultValue,
  onChange,
  name,
  required,
  min,
  max,
  rangeStart,
  rangeEnd,
  placeholder = "Seleziona data",
  tone = "pms",
  open: openProp,
  onOpenChange,
  returnFocusOnSelect = true,
  clearable,
  className,
  contentClassName,
  align = "start",
  icon,
  "aria-label": ariaLabel,
}: {
  id?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  name?: string;
  required?: boolean;
  min?: string;
  max?: string;
  rangeStart?: string;
  rangeEnd?: string;
  placeholder?: string;
  tone?: DatePickerTone;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  returnFocusOnSelect?: boolean;
  clearable?: boolean;
  className?: string;
  contentClassName?: string;
  align?: "start" | "center" | "end";
  icon?: ReactNode;
  "aria-label"?: string;
}) {
  const style = tones[tone];
  const labelId = useId();
  const [inner, setInner] = useState(defaultValue ?? "");
  const current = value ?? inner;
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const today = todayISO();
  const startDay = () => current || (min && min > today ? min : today);
  const [focused, setFocused] = useState(startDay);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setFocused(startDay());
  }
  const month = monthOf(focused);
  const gridRef = useRef<HTMLTableElement>(null);
  const picked = useRef(false);

  const low = rangeStart && rangeEnd ? rangeStart : undefined;
  const high = rangeStart && rangeEnd ? rangeEnd : undefined;

  const isDisabled = (iso: string) => Boolean((min && iso < min) || (max && iso > max));

  const setOpen = (next: boolean) => {
    if (openProp === undefined) setOpenState(next);
    onOpenChange?.(next);
  };

  const focusDay = (iso: string) => {
    setFocused(iso);
    requestAnimationFrame(() => {
      gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${iso}"]`)?.focus();
    });
  };

  const select = (iso: string) => {
    if (isDisabled(iso)) return;
    picked.current = true;
    if (value === undefined) setInner(iso);
    onChange?.(iso);
    setOpen(false);
  };

  const clear = () => {
    picked.current = true;
    if (value === undefined) setInner("");
    onChange?.("");
    setOpen(false);
  };

  const onGridKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
    const moves: Record<string, () => string> = {
      ArrowLeft: () => addDaysISO(focused, -1),
      ArrowRight: () => addDaysISO(focused, 1),
      ArrowUp: () => addDaysISO(focused, -7),
      ArrowDown: () => addDaysISO(focused, 7),
      Home: () => addDaysISO(focused, -weekdayIndex(focused)),
      End: () => addDaysISO(focused, 6 - weekdayIndex(focused)),
      PageUp: () => clampDay(focused, shiftMonth(month, event.shiftKey ? -12 : -1)),
      PageDown: () => clampDay(focused, shiftMonth(month, event.shiftKey ? 12 : 1)),
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    focusDay(move());
  };

  const canPrev = !min || shiftMonth(month, -1) >= monthOf(min);
  const canNext = !max || shiftMonth(month, 1) <= monthOf(max);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <span className="relative block">
        <PopoverPrimitive.Trigger
          id={id}
          type="button"
          aria-label={ariaLabel}
          aria-haspopup="dialog"
          data-empty={current === ""}
          className={cn(style.trigger, className)}
        >
          <span className="min-w-0 truncate">{current ? formatPickerDate(current) : placeholder}</span>
          {icon === undefined && tone === "pms" ? (
            <CalendarDays className="size-4 shrink-0 text-[var(--pms-muted)]" strokeWidth={1.6} aria-hidden />
          ) : (
            icon
          )}
        </PopoverPrimitive.Trigger>
        {name || required ? (
          <input
            tabIndex={-1}
            aria-hidden
            name={name}
            required={required}
            value={current}
            onChange={() => undefined}
            className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
          />
        ) : null}
      </span>
      <PopoverPrimitive.Portal container={portalContainer(tone)}>
        <PopoverPrimitive.Content
          aria-labelledby={labelId}
          align={align}
          sideOffset={8}
          collisionPadding={12}
          className={cn(style.content, "outline-none", contentClassName)}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${focused}"]`)?.focus();
          }}
          onCloseAutoFocus={(event) => {
            if (picked.current && !returnFocusOnSelect) event.preventDefault();
            picked.current = false;
          }}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <button
              type="button"
              className={style.nav}
              disabled={!canPrev}
              onClick={() => setFocused(clampDay(focused, shiftMonth(month, -1)))}
              aria-label="Mese precedente"
            >
              <ChevronLeft className="size-4" strokeWidth={1.7} />
            </button>
            <p id={labelId} className={style.title} aria-live="polite">
              {capitalize(format(toDate(`${month}-01`), "LLLL yyyy", { locale: it }))}
            </p>
            <button
              type="button"
              className={style.nav}
              disabled={!canNext}
              onClick={() => setFocused(clampDay(focused, shiftMonth(month, 1)))}
              aria-label="Mese successivo"
            >
              <ChevronRight className="size-4" strokeWidth={1.7} />
            </button>
          </div>

          <table ref={gridRef} role="grid" aria-labelledby={labelId} className="w-full border-collapse" onKeyDown={onGridKeyDown}>
            <thead>
              <tr>
                {WEEKDAYS.map((day, index) => (
                  <th key={day} scope="col" abbr={WEEKDAY_NAMES[index]} className={cn("pb-1.5 text-center font-normal", style.weekday)}>
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthWeeks(month).map((week, row) => (
                <tr key={row}>
                  {week.map((iso, column) => {
                    if (!iso) return <td key={`empty-${column}`} role="gridcell" />;
                    const selected = iso === current;
                    const disabled = isDisabled(iso);
                    const inRange = Boolean(low && high && iso >= low && iso <= high);
                    const edge = iso === low || iso === high;
                    return (
                      <td
                        key={iso}
                        role="gridcell"
                        aria-selected={selected || undefined}
                        className={cn(
                          "p-0 text-center",
                          inRange && style.range,
                          inRange && iso === low && "rounded-l-full",
                          inRange && iso === high && "rounded-r-full",
                          inRange && column === 0 && "rounded-l-full",
                          inRange && column === 6 && "rounded-r-full",
                        )}
                      >
                        <button
                          type="button"
                          data-day={iso}
                          tabIndex={iso === focused ? 0 : -1}
                          aria-disabled={disabled || undefined}
                          aria-current={iso === today ? "date" : undefined}
                          aria-label={capitalize(format(toDate(iso), "EEEE d MMMM yyyy", { locale: it }))}
                          onClick={() => select(iso)}
                          onFocus={() => setFocused(iso)}
                          className={cn(
                            "mx-auto grid aspect-square w-full max-w-10 place-items-center outline-none",
                            style.day,
                            iso === today && !selected && !edge && style.today,
                            disabled && !edge && style.disabled,
                            (selected || edge) && style.selected,
                            disabled ? "cursor-not-allowed" : "cursor-pointer",
                          )}
                        >
                          {Number(iso.slice(8, 10))}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-2 flex min-h-5 items-center justify-between gap-3 px-1">
            {isDisabled(today) ? (
              <span />
            ) : (
              <button type="button" className={style.footer} onClick={() => select(today)}>
                Oggi
              </button>
            )}
            {clearable && current ? (
              <button type="button" className={style.footer} onClick={clear}>
                Cancella
              </button>
            ) : null}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
