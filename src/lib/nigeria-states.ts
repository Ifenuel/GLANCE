/**
 * The 36 Nigerian states plus the FCT, each with an approximate position on a
 * tile-grid map (col 0 = west, row 0 = north). The tile map keeps the page
 * light, a few KB instead of hundreds of KB of boundary SVG paths, while
 * still reading as a map of Nigeria.
 */
export type NigeriaState = {
  name: string;
  code: string;
  col: number;
  row: number;
};

export const NIGERIA_STATES: NigeriaState[] = [
  // North (row 0, 2)
  { name: "Sokoto", code: "SOK", col: 1, row: 0 },
  { name: "Zamfara", code: "ZAM", col: 2, row: 0 },
  { name: "Katsina", code: "KAT", col: 3, row: 0 },
  { name: "Jigawa", code: "JIG", col: 4, row: 0 },
  { name: "Yobe", code: "YOB", col: 5, row: 0 },
  { name: "Borno", code: "BOR", col: 7, row: 0 },
  { name: "Kebbi", code: "KEB", col: 0, row: 1 },
  { name: "Kano", code: "KAN", col: 3, row: 1 },
  { name: "Bauchi", code: "BAU", col: 5, row: 1 },
  { name: "Gombe", code: "GOM", col: 6, row: 1 },
  { name: "Adamawa", code: "ADA", col: 7, row: 1 },
  { name: "Niger", code: "NIG", col: 2, row: 2 },
  { name: "Kaduna", code: "KAD", col: 3, row: 2 },
  { name: "Plateau", code: "PLA", col: 5, row: 2 },
  { name: "Taraba", code: "TAR", col: 6, row: 3 },
  // Middle belt (row 3, 4)
  { name: "Kwara", code: "KWA", col: 1, row: 3 },
  { name: "FCT", code: "FCT", col: 3, row: 3 },
  { name: "Nasarawa", code: "NAS", col: 4, row: 3 },
  { name: "Oyo", code: "OYO", col: 0, row: 4 },
  { name: "Kogi", code: "KOG", col: 3, row: 4 },
  { name: "Benue", code: "BEN", col: 5, row: 4 },
  // South-west and south-east (row 5, 6)
  { name: "Ogun", code: "OGU", col: 0, row: 5 },
  { name: "Osun", code: "OSU", col: 1, row: 5 },
  { name: "Ekiti", code: "EKI", col: 2, row: 5 },
  { name: "Anambra", code: "ANA", col: 3, row: 5 },
  { name: "Enugu", code: "ENU", col: 4, row: 5 },
  { name: "Ebonyi", code: "EBO", col: 5, row: 5 },
  { name: "Lagos", code: "LAG", col: 0, row: 6 },
  { name: "Ondo", code: "OND", col: 1, row: 6 },
  { name: "Edo", code: "EDO", col: 2, row: 6 },
  { name: "Delta", code: "DEL", col: 3, row: 6 },
  { name: "Imo", code: "IMO", col: 4, row: 6 },
  { name: "Cross River", code: "CRR", col: 6, row: 6 },
  // South-south (row 7)
  { name: "Bayelsa", code: "BAY", col: 2, row: 7 },
  { name: "Rivers", code: "RIV", col: 4, row: 7 },
  { name: "Abia", code: "ABI", col: 5, row: 7 },
  { name: "Akwa Ibom", code: "AKI", col: 6, row: 7 },
];

/** Known alias strings for the FCT often seen in seed data and forms. */
const ALIASES: Record<string, string> = {
  abuja: "FCT",
  "federal capital territory": "FCT",
  fct: "FCT",
  "f.c.t": "FCT",
};

/**
 * Canonical state key for a free-text chapter.state value. Returns null when
 * the text does not name a Nigerian state, so unknown values surface in a
 * dedicated "Unmapped" row instead of silently disappearing.
 */
export function canonicalStateKey(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/^state\s+of\s+/, "")
    .replace(/\s+state$/, "")
    .replace(/[^a-z.\s]/g, "")
    .replace(/\s+/g, " ");
  if (!cleaned) return null;
  if (ALIASES[cleaned]) return ALIASES[cleaned];
  const hit = NIGERIA_STATES.find((s) => s.name.toLowerCase() === cleaned);
  return hit ? hit.name : null;
}
