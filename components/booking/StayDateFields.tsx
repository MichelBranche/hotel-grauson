"use client";

import { CalendarRange } from "lucide-react";
import { useState } from "react";

import { DatePicker } from "@pms-core/components/ui/date-picker";
import { addDaysISO, todayISO } from "@pms-core/lib/dates";

const fieldShell =
  "flex min-w-0 flex-1 items-center gap-3 rounded-[var(--radius-soft)] px-3 py-2.5 transition-colors duration-400 [transition-timing-function:var(--ease-out)] hover:bg-[rgb(37_39_33_/_0.035)] focus-within:bg-[rgb(37_39_33_/_0.045)] md:rounded-full md:px-4";

export function StayDateFields({
  idPrefix,
  checkIn,
  checkOut,
  onCheckIn,
  onCheckOut,
  required,
}: {
  idPrefix: string;
  checkIn: string;
  checkOut: string;
  onCheckIn: (value: string) => void;
  onCheckOut: (value: string) => void;
  required?: boolean;
}) {
  const [checkOutOpen, setCheckOutOpen] = useState(false);
  const today = todayISO();
  const checkInId = `${idPrefix}-check-in`;
  const checkOutId = `${idPrefix}-check-out`;

  return (
    <>
      <div className={fieldShell}>
        <CalendarRange className="size-[17px] shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
        <span className="flex min-w-0 flex-1 flex-col">
          <label htmlFor={checkInId} className="text-[0.6875rem] text-muted">
            Check-in
          </label>
          <DatePicker
            id={checkInId}
            tone="site"
            value={checkIn}
            min={today}
            required={required}
            rangeStart={checkIn}
            rangeEnd={checkOut}
            returnFocusOnSelect={false}
            onChange={(value) => {
              onCheckIn(value);
              const stale = !checkOut || checkOut <= value;
              if (stale) onCheckOut(addDaysISO(value, 1));
              if (stale || !checkOut) setCheckOutOpen(true);
            }}
          />
        </span>
      </div>

      <span aria-hidden className="hidden h-8 w-px shrink-0 bg-[rgb(37_39_33_/_0.07)] sm:block" />

      <div className={fieldShell}>
        <CalendarRange className="size-[17px] shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
        <span className="flex min-w-0 flex-1 flex-col">
          <label htmlFor={checkOutId} className="text-[0.6875rem] text-muted">
            Check-out
          </label>
          <DatePicker
            id={checkOutId}
            tone="site"
            value={checkOut}
            min={checkIn ? addDaysISO(checkIn, 1) : addDaysISO(today, 1)}
            required={required}
            rangeStart={checkIn}
            rangeEnd={checkOut}
            open={checkOutOpen}
            onOpenChange={setCheckOutOpen}
            onChange={onCheckOut}
          />
        </span>
      </div>
    </>
  );
}
