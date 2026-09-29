export const LIST_STATUSES = ["OPTION", "CONFIRMED", "CHECKED_IN", "CANCELLED"] as const;

export type ListStatus = (typeof LIST_STATUSES)[number];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type ReservationListQuery = {
  room?: string;
  queue: boolean;
  status?: ListStatus;
  from?: string;
  to?: string;
};

export function parseReservationListQuery(input: {
  room?: string;
  coda?: string;
  stato?: string;
  from?: string;
  to?: string;
}): ReservationListQuery {
  const room = input.room?.trim() || undefined;
  const status = LIST_STATUSES.find((item) => item === input.stato);
  const from = input.from && ISO_DATE.test(input.from) ? input.from : undefined;
  const to = input.to && ISO_DATE.test(input.to) ? input.to : undefined;
  return { room, queue: input.coda === "web", status, from, to };
}

export function reservationListHref(filters: Partial<ReservationListQuery> & { queue?: boolean }) {
  const params = new URLSearchParams();
  if (filters.room) params.set("room", filters.room);
  if (filters.queue) params.set("coda", "web");
  if (filters.status) params.set("stato", filters.status);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  const query = params.toString();
  return query ? `/pms/reservations?${query}` : "/pms/reservations";
}

export function checkInInRange(checkIn: string, from?: string, to?: string) {
  if (from && checkIn < from) return false;
  if (to && checkIn > to) return false;
  return true;
}

/** Empty copy for the reservation list. Web queue wording stays when the queue itself is empty. */
export function reservationListEmpty(input: {
  queue: boolean;
  total: number;
  web: number;
  shown: number;
  filtered: boolean;
}) {
  if (input.shown > 0) return null;
  if (input.queue && input.web === 0) return "Nessuna richiesta web in attesa.";
  if (input.filtered) return "Nessuna prenotazione con questi filtri.";
  if (input.queue) return "Nessuna richiesta web in attesa.";
  return "Nessuna prenotazione.";
}
