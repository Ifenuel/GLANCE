/**
 * Instant feedback for portal navigation. Portal pages run authorisation and
 * database queries per request, so a cold hit can take a moment; this shell
 * keeps the sidebar visible (it lives in the layout above this file) and
 * shows a calm skeleton instead of a frozen previous screen.
 */
export default function PortalLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-3 w-32 rounded bg-navy-100" />
      <div className="h-8 w-[min(420px,70%)] rounded-lg bg-navy-100" />
      <div className="h-4 w-[min(560px,90%)] rounded bg-navy-50" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 rounded-xl bg-navy-50/80" />
        ))}
      </div>
      <div className="h-72 rounded-xl bg-navy-50/60" />
    </div>
  );
}
