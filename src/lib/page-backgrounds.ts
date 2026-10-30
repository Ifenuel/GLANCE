/**
 * One place that maps every inner page to a photographic hero background.
 *
 * The chessboard stills you supplied are thematic: GLANCE's promise is that
 * members learn to read the room, see the whole board and make moves that
 * matter — a game of strategy, not luck. Public convening photos fill the
 * pages about people and gatherings.
 */
import type { StaticImageData } from "next/image";

import audienceClap from "@/assets/audience-clap.jpg";
import audienceWide from "@/assets/audience-wide.jpg";
import chessMatch from "@/assets/chess-match.png";
import goldVsShadow from "@/assets/gold-vs-shadow.png";
import hallConversation from "@/assets/hall-conversation.jpg";
import heroCrowd from "@/assets/hero-crowd.jpg";
import kingMoves from "@/assets/king-moves.png";
import leadingBook from "@/assets/leading-at-27-book.jpg";
import stageGroup from "@/assets/stage-group.jpg";
import stageSeyi from "@/assets/stage-seyi.jpg";

export const pageBackgrounds = {
  /** Join — the decision to step onto the board. */
  join: {
    image: goldVsShadow,
    alt: "Two young people face each other across a brightly lit chessboard, one side in gold, one side in shadow",
  },
  /** Start a chapter — you make the move that builds the network. */
  startChapter: {
    image: kingMoves,
    alt: "A hand reaching down to move a gold piece on a chessboard of gold and silver pieces",
  },
  /** Alumni — the game continues after the campus years. */
  alumni: {
    image: chessMatch,
    alt: "A dramatic chessboard mid-game between a dark set and a classical white set",
  },
  /** Pathway — the staged progression of the programme. */
  pathway: {
    image: kingMoves,
    alt: "A hand reaching down to move a gold piece on a chessboard of gold and silver pieces",
  },
  /** Leading at 27 — Seyi Adisa's book, staged around a talk. */
  leadingAt27: {
    image: leadingBook,
    alt: "Copies of the Leading at 27 book presented at a GLANCE gathering",
  },
  /** Partners — convening rooms where institutions meet. */
  partners: {
    image: stageGroup,
    alt: "GLANCE members and partners together on the convening stage",
  },
  /** Events — sessions, roundtables and campus activations. */
  events: {
    image: audienceWide,
    alt: "A wide hall of attendees at a GLANCE campus activation",
  },
  /** Gallery — the movement, in pictures and film. */
  gallery: {
    image: audienceClap,
    alt: "The GLANCE audience applauding during a session",
  },
  /** About — the people behind the movement. */
  about: {
    image: stageSeyi,
    alt: "Seyi Adisa addressing a GLANCE gathering from the stage",
  },
  /** News — published by the secretariat. */
  news: {
    image: hallConversation,
    alt: "A GLANCE session conversation in the hall",
  },
  /** Chapters — the network of campus clubs. */
  chapters: {
    image: heroCrowd,
    alt: "A GLANCE crowd at a national convening",
  },
  /** Contact — the secretariat, reachable in person and online. */
  contact: {
    image: heroCrowd,
    alt: "A GLANCE crowd at a national convening",
  },
  /** Search — utilitarian page, still gets a warm photographic veil. */
  search: {
    image: chessMatch,
    alt: "A dramatic chessboard mid-game between a dark set and a classical white set",
  },
} satisfies Record<string, { image: StaticImageData; alt: string }>;

/** Legal pages keep a calmer repetition of the strategy stills. */
export const legalBackground = {
  image: chessMatch,
  alt: "A dramatic chessboard mid-game between a dark set and a classical white set",
};
