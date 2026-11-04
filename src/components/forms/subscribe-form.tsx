/**
 * The one-field "keep me informed" form used in the footer and on /newsletter.
 *
 * A plain HTML form posting to a route handler: no client JavaScript, no
 * hydration, works even if the browser blocks scripts. It also keeps the shared
 * footer free of server actions, so every page stays statically renderable.
 * Consent is recorded server-side with a timestamp when the row is created, and
 * the double opt-in email is what actually adds someone to the list; the
 * outcome is reported on /newsletter.
 */
export function SubscribeForm({
  source = "footer",
  tone = "dark",
  className = "",
}: {
  source?: string;
  tone?: "dark" | "light";
  className?: string;
}) {
  const dark = tone === "dark";
  const inputId = `subscribe-email-${source}`;

  return (
    <form
      action="/api/newsletter/subscribe"
      method="post"
      className={`w-full max-w-[440px] ${className}`}
    >
      <input type="hidden" name="source" value={source} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor={inputId} className="sr-only">
          Email address
        </label>
        <input
          id={inputId}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className={
            dark
              ? "h-11 w-full min-w-0 rounded-lg border border-white/20 bg-white/10 px-3.5 text-[13.5px] text-white placeholder:text-white/40 focus:border-gold-400 focus:outline-none"
              : "h-11 w-full min-w-0 rounded-lg border border-line bg-white px-3.5 text-[13.5px] text-navy-900 placeholder:text-ink-400 focus:border-navy-400 focus:outline-none"
          }
        />
        <button
          type="submit"
          className={
            dark
              ? "inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-gold-400 px-5 text-[13px] font-bold text-navy-950 transition-colors hover:bg-gold-300"
              : "inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-navy-900 px-5 text-[13px] font-bold text-white transition-colors hover:bg-navy-800"
          }
        >
          Notify me
        </button>
      </div>
      <p
        className={`mt-2 text-[12px] leading-[1.6] ${
          dark ? "text-white/60" : "text-ink-500"
        }`}
      >
        Occasional updates: new chapters, events and programmes.
      </p>
    </form>
  );
}
