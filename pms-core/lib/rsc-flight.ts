/**
 * Keeps router.refresh() from sharing a flight with a server action.
 *
 * Next applies an action result and a refresh as two RSC payloads. When the
 * live stream starts both in the same turn, production surfaces that as
 * React error #441 ("An error occurred in the Server Components render")
 * and the PMS error boundary ("Operazione non riuscita"). Refresh waits
 * until tracked action/RSC bodies have been consumed.
 */

type Schedule = (fn: () => void) => void;

export type RscGate = {
  begin: () => void;
  end: () => void;
  whenIdle: (task: () => void) => void;
};

export function createRscGate(schedule: Schedule): RscGate {
  let depth = 0;
  const queue: Array<() => void> = [];
  let scheduled = false;

  const pump = () => {
    if (scheduled || depth > 0 || queue.length === 0) return;
    const task = queue[0];
    if (!task) return;
    scheduled = true;
    schedule(() => {
      scheduled = false;
      if (depth > 0) {
        pump();
        return;
      }
      queue.shift();
      task();
      pump();
    });
  };

  return {
    begin() {
      depth += 1;
    },
    end() {
      depth = Math.max(0, depth - 1);
      pump();
    },
    whenIdle(task) {
      queue.push(task);
      pump();
    },
  };
}

const gate = createRscGate((fn) => {
  setTimeout(fn, 0);
});

export function beginRscFlight() {
  gate.begin();
}

export function endRscFlight() {
  gate.end();
}

/** Runs `task` after in-flight action and RSC responses have been read. */
export function whenRscIdle(task: () => void) {
  gate.whenIdle(task);
}

/** Server actions only. Full RSC navigations are left alone so a clone cannot disturb them. */
export function isTrackedFlight(headers: Headers): boolean {
  return headers.has("next-action");
}

export function flightHeaders(input: RequestInfo | URL, init?: RequestInit): Headers {
  const headers = new Headers(typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined);
  if (init?.headers) {
    new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  }
  return headers;
}

/**
 * Resolves once a copy of the body has been read. The original response is
 * returned untouched so Next can parse the action flight itself.
 */
export function observeFlightResponse(response: Response, onDone: () => void): Response {
  let settled = false;
  const finish = () => {
    if (settled) return;
    settled = true;
    onDone();
  };
  if (!response.body) {
    finish();
    return response;
  }
  let copy: Response;
  try {
    copy = response.clone();
  } catch {
    finish();
    return response;
  }
  void copy.arrayBuffer().then(finish, finish);
  return response;
}

export function installRscFlightTracker() {
  if (typeof window === "undefined") return;
  const host = globalThis as typeof globalThis & { __pmsRscFlight?: boolean };
  if (host.__pmsRscFlight) return;
  host.__pmsRscFlight = true;
  const original = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const tracked = isTrackedFlight(flightHeaders(input, init));
    if (!tracked) return original(input, init);
    beginRscFlight();
    try {
      const response = await original(input, init);
      try {
        return observeFlightResponse(response, endRscFlight);
      } catch {
        endRscFlight();
        return response;
      }
    } catch (error) {
      endRscFlight();
      throw error;
    }
  };
}
