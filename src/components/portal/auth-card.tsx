import Link from "next/link";
import { GlanceLogo } from "@/components/glance-logo";

/**
 * Shared shell for the unauthenticated portal pages (login, activation,
 * password recovery) so every screen presents the same identity and spacing.
 */
export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-5">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-3 text-center">
          <GlanceLogo />
          <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">
            {title}
          </h1>
          <p className="text-[13.5px] leading-6 text-ink-500">{subtitle}</p>
        </div>

        <div className="mt-8 rounded-2xl border border-line bg-white p-6 shadow-[0_24px_60px_-32px_rgba(5,42,92,0.4)] sm:p-8">
          {children}
        </div>

        {footer ? (
          <div className="mt-6 text-center text-[12px] leading-5 text-ink-400">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function AuthBackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="font-semibold text-navy-900 underline decoration-gold-400 decoration-2 underline-offset-4"
    >
      {children}
    </Link>
  );
}
