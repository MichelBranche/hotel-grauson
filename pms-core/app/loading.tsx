export default function PmsLoading() {
  return (
    <div className="pms-skeleton space-y-5 pt-1" role="status" aria-live="polite">
      <span className="sr-only">Caricamento…</span>
      <div className="space-y-2">
        <div className="pms-skeleton-block h-7 w-48" />
        <div className="pms-skeleton-block h-4 w-72 max-w-full" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="pms-skeleton-block h-[88px] rounded-[var(--pms-radius-sm)]" />
        ))}
      </div>
      <div className="pms-skeleton-block h-[320px] rounded-[var(--pms-radius)]" />
    </div>
  );
}
