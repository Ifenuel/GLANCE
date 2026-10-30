"use client";

import { useSyncExternalStore } from "react";

/** The year never changes while a page is open, so there is nothing to watch. */
const subscribe = () => () => {};

/**
 * The copyright year. `new Date()` is an unstable value during prerendering —
 * even inside a client component — so the year is read through
 * `useSyncExternalStore`: the server and the first client render agree on
 * `null`, then the year appears, with no effect that sets state. Nothing is
 * typed or stored, so the delay is purely visual.
 */
export function CopyrightYear() {
  const year = useSyncExternalStore<number | null>(
    subscribe,
    () => new Date().getFullYear(),
    () => null,
  );

  return <>{year === null ? "\u00A0" : year}</>;
}
