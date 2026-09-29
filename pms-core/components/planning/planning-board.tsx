"use client";

import { DndContext, DragOverlay, PointerSensor, useDraggable, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import type { RoomStatus } from "@prisma/client";
import { BedDouble, CalendarDays, ChevronLeft, ChevronRight, CircleCheck, Plus, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { getPlanningAction } from "@pms-core/actions/lookups";
import { moveReservationAction } from "@pms-core/actions/reservations";
import { updateHousekeepingStatusAction } from "@pms-core/actions/housekeeping";
import { updateRoomStatusAction } from "@pms-core/actions/rooms";
import { releasedStatuses, reservationStatusMeta, roomStatusMeta } from "@pms-core/config/status";
import { reportAction } from "@pms-core/components/ui/action-feedback";
import type { DeskPermissions, StayPatch } from "@pms-core/components/reservations/lifecycle-actions";
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

const ROOM_STATUS_CHOICES = ["CLEANING", "AVAILABLE", "INSPECTED"] as const satisfies readonly RoomStatus[];

const ROOM_STATUS_CHOICE_ICON = {
  CLEANING: Sparkles,
  AVAILABLE: CircleCheck,
  INSPECTED: ShieldCheck,
} as const;

export function PlanningBoard({
  initial,
  extras,
  plans,
  permissions,
  businessToday,
  canSetRoomStatus,
  roomStatusVia,
}: {
  initial: PlanningData;
  extras: { id: string; name: string; price: number }[];
  plans: { id: string; code: string; name: string }[];
  permissions: DeskPermissions;
  businessToday: string;
  canSetRoomStatus: boolean;
  roomStatusVia: "rooms" | "housekeeping";
}) {
  const [data, setData] = useState(initial);
  const [view, setView] = useState<PlanningView>("twoweeks");
  const [anchor, setAnchor] = useState(initial.from);
  const [selectedId, setSelectedId] = useState<string | null>(initial.reservations[0]?.id ?? null);
  const [moveOpen, setMoveOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [active, setActive] = useState<PlanningReservation | null>(null);
  const [rangePicker, setRangePicker] = useState(anchor);
  const [statusMenu, setStatusMenu] = useState<string | null>(null);
  const [statusPending, setStatusPending] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const loadId = useRef(0);
  const moving = useRef(new Set<string>());
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const from = anchor;
  const to = addDaysISO(anchor, spans[view]);

  useEffect(() => {
    const token = ++loadId.current;
    let cancelled = false;
    void getPlanningAction(from, to).then((result) => {
      if (!cancelled && token === loadId.current && result.ok) setData(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  const days = eachISODate(from, to);
  const dayWidth = widths[view];
  const selected = data.reservations.find((item) => item.id === selectedId) ?? null;

  function refreshBoard() {
    const token = ++loadId.current;
    return getPlanningAction(from, to).then((result) => {
      if (token === loadId.current && result.ok) setData(result.data);
    });
  }

  function applyStayPatch(id: string, patch: StayPatch) {
    setData((current) => ({
      ...current,
      rooms: current.rooms.map((room) => {
        const stay = current.reservations.find((item) => item.id === id);
        return stay && room.id === stay.roomId ? { ...room, status: patch.roomStatus } : room;
      }),
      reservations: current.reservations.map((item) =>
        item.id === id
          ? { ...item, status: patch.status, total: patch.total, checkOut: patch.checkOut, nights: patch.nights }
          : item,
      ),
    }));
  }

  function onDeskChanged(patch?: StayPatch) {
    if (patch && selectedId) applyStayPatch(selectedId, patch);
    void refreshBoard();
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
    if (moving.current.has(id)) return;
    if (next.roomId === previous.roomId && next.checkIn === previous.checkIn && next.checkOut === previous.checkOut) return;
    moving.current.add(id);
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
    moving.current.delete(id);
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
      toast.error(result.error, { id: `move-${id}` });
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
    const unchanged =
      result.data.roomId === previous.roomId &&
      result.data.checkIn === previous.checkIn &&
      result.data.checkOut === previous.checkOut &&
      result.data.total === result.data.previousTotal;
    if (unchanged) return;
    const priceNote =
      result.data.previousTotal === result.data.total
        ? ""
        : ` Totale ${formatMoneyExact(result.data.previousTotal)} → ${formatMoneyExact(result.data.total)}.`;
    toast.success(`Prenotazione spostata.${priceNote}`, {
      id: `move-${id}`,
      action: {
        label: "Annulla",
        onClick: () => {
          void applyMove(id, previous, next);
        },
      },
    });
  }

  async function setRoomStatus(roomId: string, status: RoomStatus) {
    const room = data.rooms.find((item) => item.id === roomId);
    if (!room || room.status === status || statusPending) return;
    const previous = room.status;
    setStatusMenu(null);
    setStatusPending(roomId);
    setData((current) => ({
      ...current,
      rooms: current.rooms.map((item) => (item.id === roomId ? { ...item, status } : item)),
    }));
    const result =
      roomStatusVia === "rooms"
        ? await updateRoomStatusAction(roomId, status)
        : await updateHousekeepingStatusAction(roomId, status);
    setStatusPending(null);
    if (!result.ok) {
      setData((current) => ({
        ...current,
        rooms: current.rooms.map((item) => (item.id === roomId ? { ...item, status: previous } : item)),
      }));
      reportAction(`room-status-${roomId}`, result, "");
      return;
    }
    reportAction(`room-status-${roomId}`, result, `Camera ${room.number}: ${roomStatusMeta[status].label}.`);
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
            <button
              type="button"
              className="pms-press h-9 rounded-full bg-[var(--pms-alpine)] px-3 text-sm font-medium text-[var(--pms-surface)] hover:bg-[var(--pms-green-soft)]"
              onClick={() => setAnchor(businessToday || todayISO())}
            >
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
                  <div className={cn("sticky left-0 z-10 flex w-[188px] shrink-0 items-center gap-2 bg-[var(--pms-surface)] px-3", statusMenu === room.id && "z-30")}>
                    <BedDouble className="size-4 shrink-0 text-[var(--pms-muted)]" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{room.number}</span>
                      <span className="block truncate text-[11px] text-[var(--pms-muted)]">
                        {room.roomTypeName}
                        {room.floorName ? ` · ${room.floorName}` : ""}
                        {room.active === false ? " · storico" : ""}
                      </span>
                    </span>
                    <RoomStatusControl
                      roomNumber={room.number}
                      status={room.status}
                      open={statusMenu === room.id}
                      pending={statusPending === room.id}
                      canChange={canSetRoomStatus}
                      onToggle={() => setStatusMenu((current) => (current === room.id ? null : room.id))}
                      onPick={(status) => void setRoomStatus(room.id, status)}
                    />
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
          onChanged={onDeskChanged}
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
          toast.success(`Prenotazione aggiornata.${priceNote}`, { id: `move-${next.id}` });
          setData((current) => ({
            ...current,
            reservations: current.reservations.map((item) =>
              item.id === next.id
                ? {
                    ...item,
                    roomId: next.roomId,
                    roomNumber: next.roomNumber,
                    roomTypeName: next.roomTypeName,
                    checkIn: next.checkIn,
                    checkOut: next.checkOut,
                    nights: next.nights,
                    total: next.total,
                    adults: next.adults,
                    children: next.children,
                    ratePlanId: next.ratePlanId,
                    guestName: next.guestName,
                    guestFirstName: next.guestFirstName,
                    guestLastName: next.guestLastName,
                    email: next.email,
                    phone: next.phone,
                  }
                : item,
            ),
          }));
          void refreshBoard();
        }}
      />
      <NewReservationWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        extras={extras}
        onCreated={() => refreshBoard()}
      />
    </div>
  );
}

function RoomStatusControl({
  roomNumber,
  status,
  open,
  pending,
  canChange,
  onToggle,
  onPick,
}: {
  roomNumber: string;
  status: RoomStatus;
  open: boolean;
  pending: boolean;
  canChange: boolean;
  onToggle: () => void;
  onPick: (status: RoomStatus) => void;
}) {
  if (status === "AVAILABLE" || status === "OCCUPIED") return null;
  const meta = roomStatusMeta[status];
  const choices = ROOM_STATUS_CHOICES.filter((choice) => choice !== status);
  if (!canChange) return <StatusBadge label={meta.label} tone={meta.tone} />;

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        className="pms-press disabled:opacity-60"
        onPointerDown={(event) => event.stopPropagation()}
        aria-label={`Stato camera ${roomNumber}: ${meta.label}`}
        aria-expanded={open}
        disabled={pending}
        onClick={onToggle}
      >
        <StatusBadge label={pending ? "Salvataggio…" : meta.label} tone={meta.tone} />
      </button>
      {open ? (
        <div className="absolute top-7 left-0 z-40 grid w-max min-w-[180px] gap-1 rounded-2xl border border-[var(--pms-line)] bg-[var(--pms-surface)] p-1 shadow-[var(--pms-shadow)]">
          {choices.map((choice) => {
            const Icon = ROOM_STATUS_CHOICE_ICON[choice];
            return (
              <button
                key={choice}
                type="button"
                className="flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-left text-xs text-[var(--pms-text)] hover:bg-[var(--pms-surface-dark)]"
                onClick={() => onPick(choice)}
              >
                <Icon className="size-3.5 shrink-0" aria-hidden />
                {roomStatusMeta[choice].label}
              </button>
            );
          })}
        </div>
      ) : null}
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
