/**
 * Registry of public website pages whose copy can be edited from the portal's
 * Website content screen — no developer needed for a copy change.
 *
 * Each entry names the SiteContent key prefix (`page.<key>.<field>`) plus the
 * fields the editor offers for that page. The built-in copy stays in the page
 * itself: an empty (or cleared) field means "use the built-in copy again",
 * exactly like the events and news sections already do. That keeps the design
 * intact until someone deliberately overrides a line.
 */

export type PageField = {
  name: string;
  label: string;
  hint?: string;
  multiline?: boolean;
  max?: number;
};

export type EditablePage = {
  /** SiteContent prefix: `page.<key>.<field>`. */
  key: string;
  /** Shown in the portal's page picker. */
  label: string;
  /** Public path, for the "View page" link and revalidation. */
  path: string;
  fields: PageField[];
};

/** The three fields every PageHeader-based page shares. */
const headerFields: PageField[] = [
  {
    name: "eyebrow",
    label: "Eyebrow",
    hint: "The small gold kicker above the title.",
    max: 80,
  },
  {
    name: "title",
    label: "Page title",
    hint: "The main headline of the page.",
    max: 160,
  },
  {
    name: "intro",
    label: "Intro paragraphs",
    hint: "Leave a blank line between paragraphs. Empty = built-in copy.",
    multiline: true,
    max: 1200,
  },
];

export const EDITABLE_PAGES: EditablePage[] = [
  {
    key: "home",
    label: "Homepage (hero)",
    path: "/",
    fields: [
      { name: "eyebrow", label: "Eyebrow", max: 80 },
      { name: "headline1", label: "Headline — line 1", max: 60 },
      { name: "headline2", label: "Headline — line 2", max: 60 },
      { name: "headline3", label: "Headline — line 3 (gold line)", max: 60 },
      {
        name: "supporting",
        label: "Supporting paragraph",
        hint: "The paragraph under the headline.",
        multiline: true,
        max: 600,
      },
    ],
  },
  {
    key: "about",
    label: "About page",
    path: "/about",
    fields: [
      ...headerFields,
      {
        name: "mission",
        label: "Mission statement",
        hint: "The mission typed out in the “Why we exist” band.",
        multiline: true,
        max: 700,
      },
      {
        name: "vision",
        label: "Vision statement",
        hint: "The vision typed out under the mission.",
        multiline: true,
        max: 700,
      },
      {
        name: "quote",
        label: "Founder pull-quote",
        hint: "The large quote in the dark band.",
        max: 220,
      },
      { name: "coreEyebrow", label: "Core values — eyebrow", max: 80 },
      { name: "coreTitle", label: "Core values — title", max: 100 },
      { name: "coreAccent", label: "Core values — accent line", max: 100 },
      {
        name: "coreIntro",
        label: "Core values — intro",
        multiline: true,
        max: 500,
      },
      { name: "journeyEyebrow", label: "Membership journey — eyebrow", max: 80 },
      { name: "journeyTitle", label: "Membership journey — title", max: 100 },
      {
        name: "journeyAccent",
        label: "Membership journey — accent line",
        max: 100,
      },
      {
        name: "journeyIntro",
        label: "Membership journey — intro",
        multiline: true,
        max: 500,
      },
      { name: "whatEyebrow", label: "What we do — eyebrow", max: 80 },
      { name: "whatTitle", label: "What we do — title", max: 100 },
      { name: "whatAccent", label: "What we do — accent line", max: 100 },
      { name: "whatIntro", label: "What we do — intro", multiline: true, max: 500 },
      { name: "howEyebrow", label: "Programme card — eyebrow", max: 80 },
      { name: "howTitle", label: "Programme card — title", max: 100 },
      {
        name: "howIntro",
        label: "Programme card — intro",
        multiline: true,
        max: 500,
      },
      { name: "founderEyebrow", label: "Founder section — eyebrow", max: 80 },
      { name: "founderTitle", label: "Founder section — title", max: 100 },
      {
        name: "founderIntro",
        label: "Founder section — intro",
        hint: "Leave a blank line between paragraphs.",
        multiline: true,
        max: 900,
      },
    ],
  },
  {
    key: "contact",
    label: "Contact page",
    path: "/contact",
    fields: [
      ...headerFields,
      { name: "chapterTitle", label: "“Start a chapter” card — title", max: 100 },
      {
        name: "chapterBody",
        label: "“Start a chapter” card — text",
        multiline: true,
        max: 400,
      },
      {
        name: "supportTitle",
        label: "Support card — title",
        max: 120,
      },
      {
        name: "supportBody",
        label: "Support card — text",
        multiline: true,
        max: 500,
      },
      { name: "formTitle", label: "Message form — title", max: 100 },
    ],
  },
  { key: "chapters", label: "Chapters directory", path: "/chapters", fields: headerFields },
  { key: "gallery", label: "Gallery page", path: "/gallery", fields: headerFields },
  { key: "alumni", label: "Alumni page", path: "/alumni", fields: headerFields },
  {
    key: "leading-at-27",
    label: "Leading at 27 page",
    path: "/leading-at-27",
    fields: headerFields,
  },
  { key: "join", label: "Join page", path: "/join", fields: headerFields },
  { key: "pathway", label: "Pathway page", path: "/pathway", fields: headerFields },
  { key: "partners", label: "Partners page", path: "/partners", fields: headerFields },
  {
    key: "start-a-chapter",
    label: "Start a chapter page",
    path: "/start-a-chapter",
    fields: headerFields,
  },
  { key: "privacy", label: "Privacy policy", path: "/privacy", fields: headerFields },
  { key: "terms", label: "Terms of use", path: "/terms", fields: headerFields },
];

export const EDITABLE_PAGE_BY_KEY = new Map(
  EDITABLE_PAGES.map((page) => [page.key, page]),
);

export function isEditablePage(key: string): EditablePage | null {
  return EDITABLE_PAGE_BY_KEY.get(key) ?? null;
}
