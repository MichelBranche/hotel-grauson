"use client";

import { useEffect, useState } from "react";

const RETRY_KEY = "pms-error-retry";
let leaveTimer: number | null = null;

function retryArmed() {
  return typeof window !== "undefined" && sessionStorage.getItem(RETRY_KEY) === "1";
}

function leaveToPlanning() {
  // router.push keeps this boundary mounted when reset() still fails.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full load clears the stuck boundary
  window.location.assign("/pms/planning");
}

function armLeave() {
  if (leaveTimer !== null) return;
  leaveTimer = window.setTimeout(() => {
    leaveTimer = null;
    sessionStorage.removeItem(RETRY_KEY);
    const title = document.querySelector("h1")?.textContent ?? "";
    if (title.includes("Operazione non riuscita")) leaveToPlanning();
  }, 1200);
}

export default function PmsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [pending, setPending] = useState(retryArmed);
  const [leaving, setLeaving] = useState(false);
  const [seen, setSeen] = useState(error);

  if (error !== seen) {
    setSeen(error);
    if (!retryArmed()) setPending(false);
  }

  useEffect(() => {
    if (retryArmed()) armLeave();
  }, []);

  function retry() {
    sessionStorage.setItem(RETRY_KEY, "1");
    setPending(true);
    armLeave();
    reset();
  }

  function goPlanning() {
    setLeaving(true);
    leaveToPlanning();
  }

  const busy = pending || leaving;

  return (
    <div className="p-8">
      <h1 className="text-xl text-[var(--pms-text)]">Operazione non riuscita</h1>
      <p className="mt-2 text-sm text-[var(--pms-muted)]">{error.message}</p>
      {error.digest ? <p className="mt-1 text-xs text-[var(--pms-muted)]">Riferimento {error.digest}</p> : null}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <button type="button" className="underline disabled:opacity-60" disabled={busy} aria-busy={busy || undefined} onClick={retry}>
          {leaving ? "Apro il planning…" : pending ? "Riprovo…" : "Riprova"}
        </button>
        <button type="button" className="underline disabled:opacity-60" disabled={busy} onClick={goPlanning}>
          Vai al planning
        </button>
      </div>
    </div>
  );
}
