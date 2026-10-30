import type { SVGProps } from "react";

const NAVY = "#05245E";
const GOLD = "#EAAE14";

type IconProps = SVGProps<SVGSVGElement>;

function Stroke({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    />
  );
}

export function ArrowRight(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M4 12h15" />
      <path d="M13 6l6 6-6 6" />
    </Stroke>
  );
}

export function ArrowUpRight(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M7 17L17 7" />
      <path d="M9 7h8v8" />
    </Stroke>
  );
}

export function ArrowLeft(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M20 12H5" />
      <path d="M11 18l-6-6 6-6" />
    </Stroke>
  );
}

export function ChevronDown(props: IconProps) {
  return (
    <Stroke strokeWidth={2.2} {...props}>
      <path d="M6 9l6 6 6-6" />
    </Stroke>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Stroke strokeWidth={2.2} {...props}>
      <path d="M4 12.5l5 5L20 6.5" />
    </Stroke>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <Stroke strokeWidth={1.9} {...props}>
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M4 20h16" />
    </Stroke>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <Stroke strokeWidth={1.9} {...props}>
      <path d="M12 18V6" />
      <path d="M7 11l5-5 5 5" />
      <path d="M4 20h16" />
    </Stroke>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <Stroke strokeWidth={1.7} {...props}>
      <path d="M12 3l7 3v5.5c0 4.4-2.9 8.2-7 9.5-4.1-1.3-7-5.1-7-9.5V6z" />
      <path d="M9.5 12.2l1.8 1.8 3.4-3.6" />
    </Stroke>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <Stroke strokeWidth={1.7} {...props}>
      <circle cx="9" cy="8" r="3.3" />
      <path d="M3.5 19.5c0-3 2.5-5.2 5.5-5.2s5.5 2.2 5.5 5.2" />
      <path d="M16 5.6a3 3 0 0 1 0 5.8" />
      <path d="M17.4 14.8c1.9.5 3.1 2.1 3.1 4.2" />
    </Stroke>
  );
}

export function DocumentIcon(props: IconProps) {
  return (
    <Stroke strokeWidth={1.7} {...props}>
      <path d="M6 3.5h7l5 5V20a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 6 20z" />
      <path d="M13 3.5V9h5" />
      <path d="M9 13h6" />
      <path d="M9 16.5h6" />
    </Stroke>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Stroke strokeWidth={1.7} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Stroke>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <Stroke strokeWidth={1.9} {...props}>
      <path d="M12 4.5l8.5 15h-17z" />
      <path d="M12 10v4" />
      <path d="M12 17h.01" />
    </Stroke>
  );
}

export function ExternalIcon(props: IconProps) {
  return (
    <Stroke strokeWidth={1.9} {...props}>
      <path d="M14 4h6v6" />
      <path d="M20 4l-8 8" />
      <path d="M18 14v5.5a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-13a.5.5 0 0 1 .5-.5H10" />
    </Stroke>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Stroke strokeWidth={2} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.6-3.6" />
    </Stroke>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Stroke strokeWidth={2} {...props}>
      <path d="M3 6h18" />
      <path d="M3 12h18" />
      <path d="M3 18h18" />
    </Stroke>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Stroke strokeWidth={2} {...props}>
      <path d="M5 5l14 14" />
      <path d="M19 5L5 19" />
    </Stroke>
  );
}

export function BuildingIcon(props: IconProps) {
  return (
    <Stroke strokeWidth={1.6} {...props}>
      <path d="M4 20V7.5a1 1 0 0 1 .6-.9l6-2.6a1 1 0 0 1 1.4.9V20" />
      <path d="M12 10l6 2.5a1 1 0 0 1 .6.9V20" />
      <path d="M3 20h18" />
    </Stroke>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <Stroke strokeWidth={1.6} {...props}>
      <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </Stroke>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <Stroke strokeWidth={1.8} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M4 7.5l8 5 8-5" />
    </Stroke>
  );
}

/* --- ABOUT: three-step icons (two-tone, as in the reference) --- */

export function UnderstandIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 42 42" aria-hidden="true" className={className}>
      <path d="M20.5 8.6C17.2 6 12.4 5.4 6 5.6v24.9c6.3-.2 11 .5 14.5 3.2V8.6z" fill={NAVY} />
      <path
        d="M20.5 8.6C23.8 6 28.6 5.4 35 5.6v24.9c-6.3-.2-11 .5-14.5 3.2V8.6z"
        fill={GOLD}
      />
      <path d="M13.5 16.5l3.4 5.4 3.3-5.4-2.1 8.2h-2.4z" fill="#fff" />
      <path d="M28.6 14.4l3.2 8.4h-2.1l-.6-1.7h-2.8l-.6 1.7h-2l3.2-8.4zm.3 5.1l-.9-2.6-.9 2.6z" fill="#fff" />
      <path d="M12 8.9c3.6-.4 6.6.2 8.5 1.9l-1.6 1.6c-1.6-1.3-4-1.8-6.9-1.6z" fill="#fff" opacity=".75" />
    </svg>
  );
}

export function EngageIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 42 42" aria-hidden="true" className={className}>
      <circle cx="21" cy="14" r="5.6" fill={GOLD} />
      <path d="M21 21.4c5.6 0 9.6 3 9.6 6.6V31H11.4v-3c0-3.6 4-6.6 9.6-6.6z" fill={NAVY} />
      <circle cx="9.4" cy="16.6" r="4.2" fill={NAVY} />
      <path d="M9.4 22.2c4 0 7 2.3 7 5v2.6H2.6v-2.6c0-2.7 3-5 6.8-5z" fill={GOLD} />
      <circle cx="32.8" cy="16.6" r="4.2" fill={GOLD} />
      <path d="M32.8 22.2c3.9 0 6.9 2.3 6.9 5v2.6h-13.6v-2.6c0-2.7 3-5 6.7-5z" fill={NAVY} />
    </svg>
  );
}

export function BuildIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 42 42" aria-hidden="true" className={className}>
      <rect x="5" y="24" width="7" height="13" fill={NAVY} />
      <rect x="15" y="17" width="7" height="20" fill={GOLD} />
      <rect x="25" y="22" width="7" height="15" fill={NAVY} />
      <rect x="33.4" y="27.6" width="5.6" height="9.4" fill={GOLD} />
      <path
        d="M6 19.5l9-6 6.5 3.4L34 7.6"
        fill="none"
        stroke={GOLD}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M39.5 4.5l1.3 5.4-5.4 1.2z" fill={GOLD} />
    </svg>
  );
}

/* --- GET INVOLVED band icons --- */

export function MemberIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth={1.7} strokeLinecap="round" aria-hidden="true" className={className}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5 20c0-3.6 3.1-6.2 7-6.2s7 2.6 7 6.2" />
    </svg>
  );
}

export function ChapterIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth={1.7} strokeLinecap="round" aria-hidden="true" className={className}>
      <circle cx="8" cy="9" r="2.6" />
      <circle cx="16" cy="9" r="2.6" />
      <path d="M3.4 18.6c0-2.6 2.1-4.4 4.6-4.4s4.6 1.8 4.6 4.4" />
      <path d="M13.6 14.9c.8-.5 1.6-.7 2.4-.7 2.5 0 4.6 1.8 4.6 4.4" />
      <path d="M12 4.2v2.2" />
    </svg>
  );
}

export function PartnerIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <circle cx="12" cy="7.4" r="3.2" />
      <path d="M6 20v-2.4c0-2.8 2.8-4.6 6-4.6s6 1.8 6 4.6V20" />
      <path d="M9.6 15.6l2.4 2 2.4-2" />
    </svg>
  );
}

export function OpportunityIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M6.5 3.5h11v3.2c0 2.6-2.4 4.6-5.5 4.6s-5.5-2-5.5-4.6z" />
      <path d="M12 11.3V17" />
      <path d="M8.8 20.5h6.4" />
      <path d="M6.5 4.6H4.2c0 3 1 4.6 3.4 5.4" />
      <path d="M17.5 4.6h2.3c0 3-1 4.6-3.4 5.4" />
    </svg>
  );
}

/* --- Social --- */

export function XIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M17.5 3h3.1l-6.8 7.8L21.8 21h-5.6l-4.4-5.7L6.7 21H3.6l7.1-8.1L3 3h5.7l4.1 5.4zm-1.1 16.1h1.7L7.7 4.8H5.9z" />
    </svg>
  );
}

export function LinkedInIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M4.98 3.5A2.5 2.5 0 1 0 5 8.5a2.5 2.5 0 0 0-.02-5zM3 9.75h4v11H3zM9.75 9.75h3.83v1.5h.06c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.77 2.5 4.77 5.76v5.69h-4v-5.05c0-1.2-.02-2.75-1.7-2.75-1.7 0-1.96 1.3-1.96 2.66v5.14h-4z" />
    </svg>
  );
}

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true" className={className}>
      <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.1" cy="6.9" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function YouTubeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M21.6 7.2c-.23-1.2-.94-2-2.1-2.2C17.7 4.7 12 4.7 12 4.7s-5.7 0-7.5.3c-1.16.2-1.87 1-2.1 2.2A25 25 0 0 0 2.2 12c0 1.6.07 3.2.2 4.8.23 1.2.94 2 2.1 2.2 1.8.3 7.5.3 7.5.3s5.7 0 7.5-.3c1.16-.2 1.87-1 2.1-2.2.13-1.6.2-3.2.2-4.8s-.07-3.2-.2-4.8zM10.1 15.3V8.7l5.6 3.3z" />
    </svg>
  );
}

export function FacebookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M13.4 21v-7.7h2.6l.4-3h-3V8.3c0-.87.24-1.46 1.5-1.46h1.6V4.16C15.9 4.1 15 4 13.9 4c-2.5 0-4.2 1.5-4.2 4.3v2h-2.6v3h2.6V21z" />
    </svg>
  );
}
