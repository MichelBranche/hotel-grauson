"use client";

import { DndContext, DragOverlay, PointerSensor, useDraggable, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { BedDouble, CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { getPlanningAction } from "@pms-core/actions/lookups";
import { moveReservationAction } from "@pms-core/actions/reservations";
import { releasedStatuses, reservationStatusMeta, roomStatusMeta } from "@pms-core/config/status";
import type { DeskPermissions } from "@pms-core/components/reservations/lifecycle-actions";
import { NewReservationWizard } from "@pms-core/components/planning/new-reservation-wizard";
import { MoveDialog } from "@pms-core/components/planning/move-dialog";
import { ReservationDrawer } from "@pms-core/components/planning/reservation-drawer";
import { StatusBadge } from "@pms-core/components/ui/badge";
import { Button } from "@pms-core/components/ui/button";
import { addDaysISO, eachISODate, formatRange, nightsBetween, todayISO } from "@pms-core/lib/dates";
import { formatMoneyExact } from "@pms-core/lib/money";
import { cn } from "@pms-core/lib/utils";
import type { PlanningData, PlanningReservation, PlanningView } from "@pms-core/types";

const ROW = 56;
const ROOM_COL = 188;
const widths: Record<PlanningView, number> = { day: 160, week: 104, twoweeks: 58, month: 36 };
const spans: Record<PlanningView, number> = { day: 1, week: 7, twoweeks: 14, month: 31 };

function Block({
  reservation,
  left,
  width,
  onSelect,
  onResize,
}: {
  reservation: PlanningReservation;
  left: number;
  width: number;
  onSelect: () => void;
  onResize: (checkOut: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: reservation.id,
    data: { reservation },
  });
  const [draftOut, setDraftOut] = useState<string | null>(null);
  const meta = reservationStatusMeta[reservation.status];
  const dayWidth = width / Math.max(reservation.nights, 1);
  const extraDays = draftOut ? nightsBetween(reservation.checkOut, draftOut) : 0;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onSelect}
      className={cn(
        "absolute top-1.5 flex h-10 items-center gap-2 rounded-full px-3 text-left text-[12px] shadow-sm",
        isDragging && "opacity-40",
      )}
      style={{
        left,
        width: Math.max(width + extraDays * dayWidth, 72),
        background: reservation.color,
        transform: CSS.Translate.toString(transform),
      }}
      title={`${reservation.guestName} · ${reservation.roomNumber} · ${reservation.checkIn} → ${reservation.checkOut}`}
    >
      {reservation.vip ? <span className="text-[10px]">VIP</span> : null}
      <span className="min-w-0 truncate font-medium">{reservation.guestName}</span>
      <span className="hidden truncate text-[11px] opacity-70 lg:inline">{reservation.adults + reservation.children} ospiti</span>
      <span className="ml-auto hidden text-[10px] opacity-70 xl:inline">{meta.label}</span>
      <span
        role="separator"
        aria-label="Modifica check-out"
        className="absolute top-1 right-1 h-8 w-2 cursor-ew-resize rounded-full bg-black/15"
        onPointerDown={(event) => {
          event.stopPropagation();
          event.preventDefault();
          const startX = event.clientX;
          const startOut = reservation.checkOut;
          let nextOut = startOut;
          const onMove = (moveEvent: PointerEvent) => {
            const delta = Math.round((moveEvent.clientX - startX) / dayWidth);
            nextOut = addDaysISO(startOut, delta);
            setDraftOut(nextOut > reservation.checkIn ? nextOut : reservation.checkOut);
          };
          const onUp = () => {
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
            setDraftOut(null);
            if (nextOut !== startOut && nextOut > reservation.checkIn) onResize(nextOut);
          };
          window.addEventListener("pointermove", onMove);
          window.addEventListener("pointerup", onUp);
        }}
      />
    </div>
  );
}

export function PlanningBoard({
  initial,
  extras,
  plans,
  permissions,
  businessToday,
}: {
  initial: PlanningData;
  extras: { id: string; name: string; price: number }[];
  plans: { id: string; code: string; name: string }[];
  permissions: DeskPermissions;
  businessToday: string;
}) {
  const [data, setData] = useState(initial);
  const [view, setView] = useState<PlanningView>("twoweeks");
  const [anchor, setAnchor] = useState(initial.from);
  const [selectedId, setSelectedId] = useState<string | null>(initial.reservations[0]?.id ?? null);
  const [moveOpen, setMoveOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [active, setActive] = useState<PlanningReservation | null>(null);
  const [rangePicker, setRangePicker] = useState(anchor);
  const scroller = useRef<HTMLDivElement>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const from = anchor;
  const to = addDaysISO(anchor, spans[view]);

  useEffect(() => {
    let cancelled = false;
    void getPlanningAction(from, to).then((result) => {
      if (!cancelled && result.ok) setData(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  const days = eachISODate(from, to);
  const dayWidth = widths[view];
  const selected = data.reservations.find((item) => item.id === selectedId) ?? null;

  function refreshBoard() {
    void getPlanningAction(from, to).then((result) => {
      if (result.ok) setData(result.data);
    });
  }

  const closedNights = useMemo(
    () => new Set(data.closedNights.map((night) => `${night.roomTypeId}:${night.date}`)),
    [data.closedNights],
  );

  const visible = useMemo(
    () => data.reservations.filter((item) => item.checkIn < to && item.checkOut > from && !releasedStatuses.includes(item.status)),
    [data.reservations, from, to],
  );

  async function applyMove(id: string, next: { roomId: string; checkIn: string; checkOut: string }, previous: { roomId: string; checkIn: string; checkOut: string }) {
    if (next.roomId === previous.roomId && next.checkIn === previous.checkIn && next.checkOut === previous.checkOut) return;
    setData((current) => ({
      ...current,
      reservations: current.reservations.map((item) =>
        item.id === id
          ? {
              ...item,
              ...next,
              nights: nightsBetween(next.checkIn, next.checkOut),
              roomNumber: current.rooms.find((room) => room.id === next.roomId)?.number ?? item.roomNumber,
            }
          : item,
      ),
    }));
    const result = await moveReservationAction({ id, ...next });
    if (!result.ok) {
      setData((current) => ({
        ...current,
        reservations: current.reservations.map((item) =>
          item.id === id
            ? {
                ...item,
                ...previous,
                nights: nightsBetween(previous.checkIn, previous.checkOut),
                roomNumber: current.rooms.find((room) => room.id === previous.roomId)?.number ?? item.roomNumber,
              }
            : item,
        ),
      }));
      toast.error(result.error);
      return;
    }
    setData((current) => ({
      ...current,
      reservations: current.reservations.map((item) =>
        item.id === id
          ? {
              ...item,
              roomId: result.data.roomId,
              roomNumber: result.data.roomNumber,
              roomTypeName: result.data.roomTypeName,
              checkIn: result.data.checkIn,
              checkOut: result.data.checkOut,
              nights: result.data.nights,
              total: result.data.total,
              adults: result.data.adults,
              children: result.data.children,
              ratePlanId: result.data.ratePlanId,
              guestName: result.data.guestName,
              guestFirstName: result.data.guestFirstName,
              guestLastName: result.data.guestLastName,
              email: result.data.email,
              phone: result.data.phone,
            }
          : item,
      ),
    }));
    const priceNote =
      result.data.previousTotal === result.data.total
        ? ""
        : ` Totale ${formatMoneyExact(result.data.previousTotal)} → ${formatMoneyExact(result.data.total)}.`;
    toast.success(`Prenotazione spostata.${priceNote}`, {
      action: {
        label: "Annulla",
        onClick: () => {
          void applyMove(id, previous, next);
        },
      },
    });
  }

  function onDragStart(event: DragStartEvent) {
    setActive(event.active.data.current?.reservation as PlanningReservation);
  }

  function onDragEnd(event: DragEndEvent) {
    const reservation = event.active.data.current?.reservation as PlanningReservation | undefined;
    setActive(null);
    if (!reservation || !event.delta) return;
    const dayShift = Math.round(event.delta.x / dayWidth);
    const rowShift = Math.round(event.delta.y / ROW);
    const roomIndex = data.rooms.findIndex((room) => room.id === reservation.roomId);
    const nextRoom = data.rooms[roomIndex + rowShift] ?? data.rooms[roomIndex];
    const nextIn = addDaysISO(reservation.checkIn, dayShift);
    const nextOut = addDaysISO(reservation.checkOut, dayShift);
    if (!nextRoom) return;
    if (nextRoom.id === reservation.roomId && nextIn === reservation.checkIn) return;
    void applyMove(
      reservation.id,
      { roomId: nextRoom.id, checkIn: nextIn, checkOut: nextOut },
      { roomId: reservation.roomId, checkIn: reservation.checkIn, checkOut: reservation.checkOut },
    );
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <section className="min-w-0 flex-1">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl">Planning camere</h1>
            <p className="text-sm text-[var(--pms-muted)]">Gestisci le prenotazioni e la disponibilità delle camere</p>
          </div>
          <Button onClick={() => setWizardOpen(true)}>
            <Plus className="size-4" /> Nuova prenotazione
          </Button>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-full bg-white/70 p-1">
            <button type="button" className="pms-press grid size-9 place-items-center rounded-full hover:bg-[var(--pms-surface-dark)]" onClick={() => setAnchor(addDaysISO(anchor, -spans[view]))} aria-label="Periodo precedente">
              <ChevronLeft className="size-4" />
            </button>
            <button type="button" className="pms-press h-9 rounded-full px-3 text-sm hover:bg-[var(--pms-surface-dark)]" onClick={() => setAnchor(todayISO())}>
              Oggi
            </button>
            <button type="button" className="pms-press grid size-9 place-items-center rounded-full hover:bg-[var(--pms-surface-dark)]" onClick={() => setAnchor(addDaysISO(anchor, spans[view]))} aria-label="Periodo successivo">
              <ChevronRight className="size-4" />
            </button>
          </div>
          <p className="text-sm font-medium">{formatRange(from, addDaysISO(to, -1))}</p>
          <input
            type="date"
            value={rangePicker}
            onChange={(event) => {
              setRangePicker(event.target.value);
              setAnchor(event.target.value);
            }}
            className="h-9 rounded-full border border-[var(--pms-line)] bg-white/70 px-3 text-sm"
            aria-label="Vai alla data"
          />
          <div className="ml-auto flex rounded-full bg-white/70 p-1 text-xs">
            {(["day", "week", "twoweeks", "month"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setView(item)}
                className={cn("pms-press rounded-full px-3 py-1.5", view === item ? "bg-[var(--pms-alpine)] text-[var(--pms-surface)]" : "hover:bg-[var(--pms-surface-dark)]")}
              >
                {item === "day" ? "Giorno" : item === "week" ? "Settimana" : item === "twoweeks" ? "2 settimane" : "Mese"}
              </button>
            ))}
          </div>
        </div>

        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div ref={scroller} className="pms-card max-h-[min(70dvh,44rem)] min-h-[28rem] overflow-auto overscroll-contain pms-scroll">
            <div style={{ minWidth: ROOM_COL + days.length * dayWidth }}>
              <div className="sticky top-0 z-20 flex border-b border-[var(--pms-line)] bg-[var(--pms-surface)]">
                <div className="sticky left-0 z-30 flex w-[188px] shrink-0 items-center gap-6 bg-[var(--pms-surface)] px-4 text-xs text-[var(--pms-muted)]">
                  <span>Camera</span>
                  <span>Tipo</span>
                </div>
                {days.map((day) => (
                  <div key={day} className="shrink-0 py-3 text-center" style={{ width: dayWidth }}>
                    <p className="text-[10px] uppercase text-[var(--pms-muted)]">{format(parseISO(day), "EEEEEE", { locale: it })}</p>
                    <p className="text-sm font-medium">{format(parseISO(day), "d")}</p>
                  </div>
                ))}
              </div>

              {data.rooms.map((room) => (
                <div key={room.id} className="relative flex border-b border-[var(--pms-line)]" style={{ height: ROW }}>
                  <div className="sticky left-0 z-10 flex w-[188px] shrink-0 items-center gap-3 bg-[var(--pms-surface)] px-3">
                    <BedDouble className="size-4 text-[var(--pms-muted)]" />
                    <span>
                      <span className="block text-sm font-medium">{room.number}</span>
                      <span className="block text-[11px] text-[var(--pms-muted)]">
                        {room.roomTypeName}
                        {room.floorName ? ` · ${room.floorName}` : ""}
                        {room.active === false ? " · storico" : ""}
                      </span>
                    </span>
                    {room.status !== "AVAILABLE" && room.status !== "OCCUPIED" ? (
                      <StatusBadge label={roomStatusMeta[room.status].label} tone={roomStatusMeta[room.status].tone} />
                    ) : null}
                  </div>
                  <div className="relative flex-1">
                    {days.map((day) => {
                      const closed = closedNights.has(`${room.roomTypeId}:${day}`);
                      return (
                        <div
                          key={day}
                          className={cn("absolute top-0 h-full border-l border-[var(--pms-line)]", closed && "pms-closed-night")}
                          style={{ left: nightsBetween(from, day) * dayWidth, width: dayWidth }}
                          title={closed ? `${room.roomTypeName} chiusa alla vendita` : undefined}
                        />
                      );
                    })}
                    {data.blocks
                      .filter((block) => block.roomId === room.id)
                      .map((block) => {
                        const start = Math.max(nightsBetween(from, block.startDate), 0);
                        const end = Math.min(nightsBetween(from, block.endDate) + 1, days.length);
                        if (end <= start) return null;
                        return (
                          <div
                            key={block.id}
                            className="pms-room-block absolute top-1.5 flex h-10 items-center truncate rounded-full px-3 text-[11px] font-medium"
                            style={{ left: start * dayWidth + 6, width: Math.max((end - start) * dayWidth - 12, 24) }}
                            title={`Camera ${room.number} chiusa ${block.startDate} → ${block.endDate}${block.reason ? ` · ${block.reason}` : ""}`}
                          >
                            <span className="truncate">Chiusa{block.reason ? ` · ${block.reason}` : ""}</span>
                          </div>
                        );
                      })}
                    {visible
                      .filter((item) => item.roomId === room.id)
                      .map((reservation) => {
                        const start = Math.max(nightsBetween(from, reservation.checkIn), 0);
                        const end = Math.min(nightsBetween(from, reservation.checkOut), days.length);
                        return (
                          <Block
                            key={reservation.id}
                            reservation={reservation}
                            left={start * dayWidth + 6}
                            width={(end - start) * dayWidth - 12}
                            onSelect={() => setSelectedId(reservation.id)}
                            onResize={(checkOut) => {
                              if (checkOut <= reservation.checkIn) return;
                              void applyMove(
                                reservation.id,
                                { roomId: reservation.roomId, checkIn: reservation.checkIn, checkOut },
                                { roomId: reservation.roomId, checkIn: reservation.checkIn, checkOut: reservation.checkOut },
                              );
                            }}
                          />
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DragOverlay>
            {active ? (
              <div className="flex h-10 items-center rounded-full px-3 text-xs shadow-lg" style={{ background: active.color, width: 180 }}>
                {active.guestName}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </section>

      <div className="flex w-full flex-col gap-4 lg:w-[300px] lg:shrink-0">
        <MiniCalendar value={anchor} onChange={setAnchor} />
        <ReservationDrawer
          reservation={selected}
          roomStatus={data.rooms.find((room) => room.id === selected?.roomId)?.status ?? "AVAILABLE"}
          extras={extras}
          permissions={permissions}
          businessToday={businessToday}
          onClose={() => setSelectedId(null)}
          onMove={() => setMoveOpen(true)}
          onChanged={refreshBoard}
        />
      </div>

      <MoveDialog
        open={moveOpen}
        onOpenChange={setMoveOpen}
        reservation={selected}
        rooms={data.rooms}
        plans={plans}
        onSaved={(next) => {
          const priceNote =
            next.previousTotal === next.total
              ? ""
              : ` Totale ${formatMoneyExact(next.previousTotal)} → ${formatMoneyExact(next.total)}.`;
          toast.success(`Prenotazione aggiornata.${priceNote}`);
          refreshBoard();
        }}
      />
      <NewReservationWizard open={wizardOpen} onOpenChange={setWizardOpen} extras={extras} onCreated={() => window.location.reload()} />
    </div>
  );
}

function MiniCalendar({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const current = parseISO(value);
  const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
  const startOffset = (monthStart.getDay() + 6) % 7;
  const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: startOffset + daysInMonth }, (_, index) => index);

  return (
    <section className="pms-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium capitalize">{format(current, "MMMM yyyy", { locale: it })}</p>
        <CalendarDays className="size-4 text-[var(--pms-muted)]" />
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-[var(--pms-muted)]">
        {"LMMGVSD".split("").map((day, index) => (
          <span key={`${day}${index}`}>{day}</span>
        ))}
        {cells.map((cell) => {
          const day = cell - startOffset + 1;
          if (day < 1) return <span key={cell} />;
          const iso = format(new Date(current.getFullYear(), current.getMonth(), day), "yyyy-MM-dd");
          const active = iso === value;
          return (
            <button
              key={cell}
              type="button"
              onClick={() => onChange(iso)}
              className={cn("grid h-8 place-items-center rounded-full", active && "bg-[var(--pms-alpine)] text-[var(--pms-surface)]")}
            >
              {day}
            </button>
          );
        })}
      </div>
    </section>
  );
}
