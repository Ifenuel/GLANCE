/**
 * Shown the instant a visitor follows an internal link, before the route's
 * server render arrives. Without it a slow first hit (cold database, first
 * visit to a page in dev) shows a frozen previous page and feels broken.
 */
export default function SiteLoading() {
  return (
    <div className="mx-auto w-full max-w-[1280px] animate-pulse px-5 py-16 sm:px-6 lg:px-8">
      <div className="h-3 w-28 rounded bg-navy-100" />
      <div className="mt-5 h-10 w-[min(560px,80%)] rounded-lg bg-navy-100" />
      <div className="mt-4 h-4 w-[min(680px,90%)] rounded bg-navy-50" />
      <div className="mt-2 h-4 w-[min(560px,75%)] rounded bg-navy-50" />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-44 rounded-xl bg-navy-50/80" />
        ))}
      </div>
    </div>
  );
}
