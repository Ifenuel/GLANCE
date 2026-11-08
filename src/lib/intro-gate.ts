/**
 * The welcome film's performance gate, kept as a pure, unit-testable rule.
 *
 * The film runs a real-time 3D building — the single heaviest thing on the
 * site — so it is skipped on devices that report little memory, few cores, a
 * data-saver, or a 2G connection. Anyone can still request it with ?intro=1.
 *
 * One platform needs special handling: iOS. WebKit clamps
 * `navigator.hardwareConcurrency` (every iPhone reports 2–4 cores regardless
 * of its real chip) and does not implement `navigator.deviceMemory` at all,
 * so the hardware guesses would misfire on even the newest iPhone and skip
 * the film for every Safari visitor. iPhones all carry strong GPUs, so on iOS
 * only the visitor's own choices — data-saver, 2G, reduced motion (handled by
 * the caller) — can skip the film, never the hardware guesses.
 */
export interface IntroEnvironment {
  deviceMemory?: number;
  hardwareConcurrency?: number;
  saveData?: boolean;
  effectiveType?: string;
  userAgent?: string;
  platform?: string;
  maxTouchPoints?: number;
}

export function isLightDevice(env: IntroEnvironment): boolean {
  const userAgent = env.userAgent ?? "";
  const isIOS =
    /iPad|iPhone|iPod/.test(userAgent) ||
    (env.platform === "MacIntel" && (env.maxTouchPoints ?? 0) > 1);

  if (!isIOS) {
    if (typeof env.deviceMemory === "number" && env.deviceMemory <= 3) {
      return true;
    }
    if (
      typeof env.hardwareConcurrency === "number" &&
      env.hardwareConcurrency <= 4
    ) {
      return true;
    }
  }

  if (env.saveData) return true;
  return /(^|-)2g/.test(env.effectiveType ?? "");
}
