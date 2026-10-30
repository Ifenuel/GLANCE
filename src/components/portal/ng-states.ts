import ngData from "./ng-states.json";

type NgState = { a: string; n: string; d: string };

const RAW = ngData as unknown as { bbox: number[]; states: NgState[] };

/**
 * Alias map: the Highcharts naming differs from how chapters record state
 * values ("FCT", "Akwa Ibom").
 */
const NAME_ALIASES: Record<string, string> = {
  "Federal Capital Territory": "FCT",
  "Akwa-Ibom": "Akwa Ibom",
};

const byName = new Map<string, NgState>();
for (const state of RAW.states) {
  byName.set(NAME_ALIASES[state.n] ?? state.n, state);
}

export const NG_BBOX = RAW.bbox;

export type NgStateEntry = NgState | undefined;

/**
 * Maps a footprint state name to the real geographic geometry, so the live
 * database numbers shade the right shape on the map. Adds `alias` helper.
 */
export function ngStateFor(name: string): NgStateEntry {
  return byName.get(NAME_ALIASES[name] ?? name);
}

export function ngStateAbbr(name: string): string | null {
  const state = byName.get(NAME_ALIASES[name] ?? name);
  return state ? state.a : null;
}
