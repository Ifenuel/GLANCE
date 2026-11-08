import { describe, expect, it } from "vitest";
import { isLightDevice } from "@/lib/intro-gate";

/**
 * The welcome film must play on iPhones. WebKit clamps hardwareConcurrency
 * (every iPhone reports 2–4) and omits deviceMemory, so a naive hardware gate
 * skips the film on 100% of iPhones. These tests pin the rules: iOS is judged
 * only on data-saver / 2G, real low-end Android hardware still skips.
 */

const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
const IPAD_DESKTOP_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15";
const ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 13; SM-A137F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

describe("welcome film performance gate", () => {
  it("plays on a modern iPhone (WebKit reports 4 clamped cores, no memory API)", () => {
    expect(
      isLightDevice({
        hardwareConcurrency: 4,
        userAgent: IPHONE_UA,
        platform: "iPhone",
        maxTouchPoints: 5,
        effectiveType: "4g",
      }),
    ).toBe(false);
  });

  it("plays on an older-clamp iPhone reporting only 2 cores", () => {
    expect(
      isLightDevice({
        hardwareConcurrency: 2,
        userAgent: IPHONE_UA,
        platform: "iPhone",
        maxTouchPoints: 5,
        effectiveType: "4g",
      }),
    ).toBe(false);
  });

  it("plays on an iPad using the desktop Safari user agent", () => {
    expect(
      isLightDevice({
        hardwareConcurrency: 4,
        userAgent: IPAD_DESKTOP_UA,
        platform: "MacIntel",
        maxTouchPoints: 5,
        effectiveType: "4g",
      }),
    ).toBe(false);
  });

  it("still skips a budget Android with 2 GB RAM and 4 cores", () => {
    expect(
      isLightDevice({
        deviceMemory: 2,
        hardwareConcurrency: 4,
        userAgent: ANDROID_UA,
        platform: "Linux armv8l",
        effectiveType: "4g",
      }),
    ).toBe(true);
  });

  it("plays on a mid-range Android (4 GB RAM, 8 cores)", () => {
    expect(
      isLightDevice({
        deviceMemory: 4,
        hardwareConcurrency: 8,
        userAgent: ANDROID_UA,
        platform: "Linux armv8l",
        effectiveType: "4g",
      }),
    ).toBe(false);
  });

  it("plays on a desktop with 8 cores", () => {
    expect(
      isLightDevice({
        hardwareConcurrency: 8,
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        platform: "Win32",
        effectiveType: "4g",
      }),
    ).toBe(false);
  });

  it("skips any device with data-saver on — including iPhones", () => {
    expect(
      isLightDevice({
        hardwareConcurrency: 4,
        userAgent: IPHONE_UA,
        platform: "iPhone",
        saveData: true,
        effectiveType: "4g",
      }),
    ).toBe(true);
  });

  it("skips any device on a 2G connection — including iPhones", () => {
    expect(
      isLightDevice({
        hardwareConcurrency: 4,
        userAgent: IPHONE_UA,
        platform: "iPhone",
        effectiveType: "2g",
      }),
    ).toBe(true);
  });
});
