export type NavLink = {
  label: string;
  href: string;
};

export type NavItem = {
  label: string;
  href: string;
  children?: NavLink[];
};

/**
 * The primary menu is grouped so the bar stays calm: five destinations, each
 * with a plain sub-menu of links (no descriptions). "Join GLANCE" lives inside
 * these lists rather than as a separate header button.
 */
export const primaryNav: NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "About",
    href: "/about",
    children: [
      { label: "About GLANCE", href: "/about" },
      { label: "Mission & Vision", href: "/about#mission" },
      { label: "The GLANCE Pathway", href: "/pathway" },
      { label: "Leading at 27", href: "/leading-at-27" },
    ],
  },
  {
    label: "Chapters",
    href: "/chapters",
    children: [
      { label: "Chapter Directory", href: "/chapters" },
      { label: "Start a Chapter", href: "/start-a-chapter" },
    ],
  },
  {
    label: "Impact",
    href: "/impact",
    children: [
      { label: "Our Impact", href: "/impact" },
      { label: "News & Stories", href: "/news" },
      { label: "Events", href: "/events" },
      { label: "Gallery", href: "/gallery" },
      { label: "Alumni", href: "/alumni" },
      { label: "Partners", href: "/partners" },
    ],
  },
  {
    label: "Get Involved",
    href: "/join",
    children: [
      { label: "Join GLANCE", href: "/join" },
      { label: "Partner With Us", href: "/partners" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

export const footerColumns = [
  {
    heading: "GLANCE",
    links: [
      { label: "About GLANCE", href: "/about" },
      { label: "The GLANCE Pathway", href: "/pathway" },
      { label: "Leading at 27", href: "/leading-at-27" },
      { label: "Chapter Directory", href: "/chapters" },
    ],
  },
  {
    heading: "Get Involved",
    links: [
      { label: "Join GLANCE", href: "/join" },
      { label: "Start a Chapter", href: "/start-a-chapter" },
      { label: "Partner With Us", href: "/partners" },
    ],
  },
  {
    heading: "Network",
    links: [
      { label: "Impact", href: "/impact" },
      { label: "News & Stories", href: "/news" },
      { label: "Events", href: "/events" },
      { label: "Gallery", href: "/gallery" },
      { label: "Alumni", href: "/alumni" },
      { label: "Contact", href: "/contact" },
    ],
  },
] as const;

/** Public social accounts. Confirm account ownership with GLANCE before launch. */
export const socialLinks = [
  { label: "Instagram", href: "https://www.instagram.com/glanceproject/" },
  { label: "X", href: "https://x.com/sjadisa" },
  { label: "LinkedIn", href: "https://ng.linkedin.com/in/seyiadisa" },
] as const;
