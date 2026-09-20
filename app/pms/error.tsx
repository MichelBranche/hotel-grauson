"use client";

export default function PmsError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-8">
      <h1 className="text-xl">Operazione non riuscita</h1>
      <p className="mt-2 text-sm text-[var(--pms-muted)]">{error.message}</p>
      <button type="button" className="mt-4 underline" onClick={reset}>
        Riprova
      </button>
    </div>
  );
}
