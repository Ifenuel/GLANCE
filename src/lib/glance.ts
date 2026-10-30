/**
 * Single source of truth for public GLANCE copy.
 *
 * Items marked `verified: false` are structural placeholders that must be
 * confirmed before launch. They are never presented to visitors as settled
 * fact.
 */

export const brand = {
  name: "GLANCE",
  expansion: "Governance, Leadership and National Civic Engagement",
  tagline: "Governance · Leadership · National Civic Engagement",
  contactEmail: "info@glance.org",
} as const;

/** The two statements that open the mission section. */
export const mission =
  "GLANCE is a structured leadership and civic engagement club operating within tertiary institutions across Africa. It is built on one belief: the future of Africa will not be shaped by educated people alone; it will be shaped by prepared leaders.";

export const vision =
  "The goal is to raise 10,000 young leaders across Nigeria who will go on to influence thousands more. Every chapter you build is one node in that network.";

export const heroCopy = {
  eyebrow: "The GLANCE Movement",
  headline: "Young People. Real Solutions. A Stronger Nation.",
  supporting:
    "GLANCE is a student leadership and civic engagement initiative. It equips young people with the knowledge, values, mentorship and exposure to lead responsibly and serve their communities.",
} as const;

/** The three principles GLANCE is built on, drawn from "Leading at 27". */
export const pillars = [
  {
    key: "character",
    number: "01",
    title: "Character",
    summary:
      "The foundation of credible leadership: personal integrity, responsibility and the values that hold under pressure.",
    detail:
      "Members begin with character because leadership without it becomes self-service. Sessions, mentorship and peer accountability help members build the habits and convictions that make influence trustworthy.",
    verified: true,
  },
  {
    key: "influence",
    number: "02",
    title: "Influence",
    summary:
      "Learning how to earn trust, communicate clearly and move people toward a shared public good.",
    detail:
      "Influence is treated as a skill, not a title. Members practise advocacy, debate, stakeholder engagement and community mobilisation inside peer-led club sessions.",
    verified: true,
  },
  {
    key: "purpose",
    number: "03",
    title: "Purpose",
    summary:
      "Turning personal development into meaningful contribution: in public service, enterprise, education, health, technology or community.",
    detail:
      "Purpose links the programme to the nation-building goal: members identify where their skills meet a public need and commit to serving there.",
    verified: true,
  },
] as const;

/** Operational model. The 30-week structure and peer-led club delivery are public. */
export const programme = {
  durationWeeks: 30,
  deliveryModel: "Peer-led campus clubs, structured over 30 weeks",
  verifiedDuration: true,
  /** GLANCE/GLANCE have not published a confirmed cohort calendar. */
  verifiedCalendar: false,
  cohortGoal: "10,000 young leaders",
  cohortGoalIsTarget: true,
  /** The year-by-year curriculum is not published. */
  verifiedCurriculum: false,
} as const;

export const leadingAt27 = {
  title: "Leading at 27",
  subtitle: "How Young Leaders Can Change the World",
  /** Promotional material also uses "Lessons in Character, Influence and Purpose". */
  alternateSubtitle: "Lessons in Character, Influence and Purpose",
  author: "Seyi Adisa",
  launched: "April 2026",
  buyUrl: "https://sunshinebookseller.com/product/leading-at-27/",
  buyNote: "Listed by Sunshine Bookseller at the time of writing.",
  verifiedPublisher: false,
  verifiedIsbn: false,
  blurb:
    "A practical leadership manual for young Africans, built on the principles that shape the GLANCE framework: character, influence and purpose.",
} as const;

export const founder = {
  name: "Seyi Adisa",
  role: "Author, Leading at 27",
  bio: [
    "Seyi Adisa is a nation-builder, leadership coach and public administrator, and the author of Leading at 27.",
    "His public biography records more than twelve years in governance, service as a member of the Oyo State House of Assembly, and service as Principal Private Secretary to the immediate past Governor of Oyo State. He also co-founded T&A Legal.",
  ],
  /** Honours and awards published by GLANCE but not independently checked here. */
  honours: [
    "MIPAD 100 Under 40 honoree",
    "Oyo State's Most Influential Young Person (2022)",
  ],
  honoursVerified: false,
} as const;

export const contentNotices = {
  mission: {
    verified: false,
    note: "GLANCE's formal mission, vision and values statement is being finalised and will be published here.",
  },
  statistics: {
    verified: false,
    note: "The figures shown are the movement's current figures.",
  },
  partners: {
    verified: false,
    note: "Partner listings are being confirmed and will be published here as they are finalised.",
  },
} as const;
