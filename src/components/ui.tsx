import type { ReactNode } from "react";
import Link from "next/link";

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mx-auto w-full max-w-[1280px] px-5 sm:px-6 lg:px-8 ${className ?? ""}`}>
      {children}
    </div>
  );
}

export function Section({ children, className, id, tone = "light" }: {
  children: ReactNode;
  className?: string;
  id?: string;
  tone?: "light" | "tint" | "navy";
}) {
  const tones = { light: "bg-white", tint: "bg-navy-50/60", navy: "navy-wash text-white" } as const;
  return (
    <section id={id} className={`py-14 lg:py-20 ${tones[tone]} ${className ?? ""}`}>
      {children}
    </section>
  );
}

export function Eyebrow({ children, tone = "dark" }: { children: ReactNode; tone?: "dark" | "light" }) {
  return (
    <p className={`text-[11.5px] font-bold tracking-[0.14em] uppercase ${tone === "light" ? "text-white/70" : "text-navy-900/65"}`}>
      {children}
    </p>
  );
}

export function SectionHeading({ eyebrow, title, accent, intro, tone = "dark", as: Tag = "h2", className }: {
  eyebrow?: string;
  title: string;
  accent?: string;
  intro?: ReactNode;
  tone?: "dark" | "light";
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  return (
    <div className={className}>
      {eyebrow ? <Eyebrow tone={tone}>{eyebrow}</Eyebrow> : null}
      <Tag className={`mt-3 text-[26px] leading-[1.2] font-extrabold tracking-[-0.015em] sm:text-[32px] ${tone === "light" ? "text-white" : "text-navy-900"}`}>
        {title}
        {accent ? <span className={`block ${tone === "light" ? "text-gold-400" : "text-gold-500"}`}>{accent}</span> : null}
      </Tag>
      {intro ? (
        <div className={`mt-4 space-y-4 text-[15px] leading-[1.85] ${tone === "light" ? "text-navy-100/85" : "text-ink-500"}`}>
          {intro}
        </div>
      ) : null}
    </div>
  );
}

export function Card({ children, className, as: Tag = "div", title, label }: {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "li";
  title?: string;
  label?: string;
}) {
  return (
    <Tag className={`rounded-xl border border-line bg-white p-5 transition-shadow hover:shadow-[0_18px_40px_-28px_rgba(5,42,92,0.5)] ${className ?? ""}`}>
      {(title || label) ? <div className="mb-3">{(label ?? null) ?? (title ? <h3 className="text-[15px] font-extrabold text-navy-900">{title}</h3> : null)}</div> : null}
      {children}
    </Tag>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-[15px] font-extrabold text-navy-900">{children}</h3>;
}

export function CardLabel({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-400">{children}</p>;
}

export function Event({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-2">{children}</div>;
}

export function ButtonLink({ href, variant = "default", size = "md", className, children, ...props }: React.ComponentProps<typeof Link> & { variant?: "default" | "outline" | "navy" | "navyOutline"; size?: "sm" | "md" }) {
  const base = "inline-flex h-11 items-center justify-center gap-2 rounded-lg text-[13px] font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-navy-500/30 focus:ring-offset-2 disabled:opacity-60";
  const variants = {
    default: "bg-navy-900 text-white hover:bg-navy-950",
    outline: "border border-line text-navy-700 hover:bg-navy-50",
    navy: "bg-navy-50 text-navy-900 hover:bg-navy-100",
    navyOutline: "border border-navy-900 text-white hover:bg-navy-900",
  };
  const sizes = { sm: "h-9 px-4 text-[12.5px]", md: "h-11 px-5" };
  return (
    <Link href={href} className={`${base} ${variants[variant]} ${sizes[size]} ${className ?? ""}`} {...props}>
      {children}
    </Link>
  );
}

export function GLANCE({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="2" y="14" width="4" height="14" rx="2" fill="#0a1b38" />
      <rect x="11" y="6" width="4" height="22" rx="2" fill="#f0b429" />
      <rect x="20" y="14" width="4" height="14" rx="2" fill="#0a1b38" />
      <path d="M13 26 L18 14 L23 26" stroke="#f0b429" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 26 L20 14 L23 26" stroke="#0a1b38" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="26" cy="10" r="2.4" fill="#f0b429" stroke="#0a1b38" strokeWidth="1.6" />
    </svg>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "active" | "pending" | "gold" | "danger" | "navy" }) {
  const tones = { neutral: "bg-navy-50 text-navy-800 border-navy-100", active: "bg-emerald-50 text-emerald-700 border-emerald-200", pending: "bg-amber-50 text-amber-700 border-amber-200", gold: "bg-gold-100 text-gold-600 border-gold-200", danger: "bg-rose-50 text-rose-700 border-rose-200", navy: "bg-navy-900 text-white border-navy-900" } as const;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function StatusDot({ tone }: { tone: "active" | "pending" | "danger" }) {
  const colors = { active: "bg-emerald-500", pending: "bg-amber-500", danger: "bg-rose-500" } as const;
  return <span aria-hidden="true" className={`h-2 w-2 rounded-full ${colors[tone]}`} />;
}

/**
 * Internal confirmation notes are no longer shown to visitors. Kept as a
 * no-op so existing call sites compile while the copy stays off the page.
 */
export function VerifiedNote({ children: _children }: { children: ReactNode }) {
  return null;
}

export function Prose({ children }: { children: ReactNode }) {
  return <div className="space-y-5 text-[15px] leading-[1.9] text-ink-500 [&_a]:font-semibold [&_a]:text-navy-900 [&_a]:underline [&_a]:decoration-gold-400 [&_a]:decoration-2 [&_a]:underline-offset-4 [&_h2]:mt-10 [&_h2]:text-[22px] [&_h2]:font-extrabold [&_h2]:text-navy-900 [&_h3]:mt-8 [&_h3]:text-[18px] [&_h3]:font-bold [&_h3]:text-navy-900 [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-navy-900">{children}</div>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-navy-50/40 px-6 py-10 text-center">
      <p className="text-[15px] font-bold text-navy-900">{title}</p>
      <p className="mx-auto mt-2 max-w-[420px] text-[13.5px] leading-[1.8] text-ink-500">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Kpi({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <p className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-400">
        {label}
      </p>
      <p className="mt-2 text-3xl font-extrabold tracking-tight text-navy-900">
        {value}
      </p>
      {hint ? <p className="mt-1 text-[12px] text-ink-500">{hint}</p> : null}
    </div>
  );
}

export function StatBlock({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-line bg-white px-5 py-4">
      <p className="text-[11.5px] font-bold tracking-[0.1em] text-ink-500 uppercase">{label}</p>
      <p className="mt-2 text-[26px] leading-none font-extrabold text-navy-900">{value}</p>
      {hint ? <p className="mt-2 text-[12.5px] text-ink-500">{hint}</p> : null}
    </div>
  );
}

export function DataTable({ head, children, caption }: { head: string[]; children: ReactNode; caption?: string }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-white">
      <table className="w-full min-w-[720px] border-collapse text-left">
        {caption ? <caption className="border-b border-line px-4 py-3 text-left text-[12.5px] text-ink-500">{caption}</caption> : null}
        <thead>
          <tr className="bg-navy-50/70">
            {head.map((column) => <th key={column} scope="col" className="px-4 py-3 text-[11.5px] font-bold tracking-[0.08em] text-navy-800 uppercase">{column}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}
