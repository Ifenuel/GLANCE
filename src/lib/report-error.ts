/**
 * Client-side error reporting.
 *
 * Error boundaries already console.error, which nobody reads in production.
 * This posts the same detail to the platform's own error log so the secretariat
 * can see a page failing without waiting for a complaint. It is deliberately
 * fire-and-forget: a reporting failure must never break the error screen, and
 * one message per error per session is enough to spot the pattern.
 */
export function reportClientError(
  error: unknown,
  source: "site" | "portal" | "global",
) {
  try {
    const err =
      error instanceof Error ? error : new Error(String(error ?? "Unknown error"));

    const key = `glance:error:${source}:${err.message}`.slice(0, 180);
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    void fetch("/api/monitoring/error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: err.message,
        stack: err.stack?.slice(0, 3000) ?? null,
        path: typeof location !== "undefined" ? location.pathname : null,
        source,
      }),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Reporting must never throw.
  }
}
