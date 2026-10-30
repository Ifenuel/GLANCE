import "server-only";

import { dbFriendlyMessage } from "./db";
import type { FormState } from "./validation";

function isNextControlFlow(error: unknown): boolean {
  const digest =
    error && typeof error === "object"
      ? String((error as { digest?: string }).digest ?? "")
      : "";
  return digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_NOT_FOUND");
}

/**
 * Wraps a server action's body so an unreachable database (paused plan, pooler
 * restart or a brief drop) surfaces as one calm sentence the user can act on,
 * instead of a raw "database query error".
 *
 * Next.js control-flow errors (redirect, notFound) are re-thrown untouched.
 * Everything unexpected is logged server-side and the visitor gets a generic
 * retry message; no engine text ever reaches the page.
 */
export async function runGuardedForm(
  run: () => Promise<FormState>,
): Promise<FormState> {
  try {
    return await run();
  } catch (error) {
    if (isNextControlFlow(error)) throw error;
    console.error("[action] failed", error);
    return { status: "error", message: dbFriendlyMessage(error) };
  }
}
