import Link from "next/link";
import { CopyrightYear } from "@/components/site/copyright-year";
import { GlanceLogo } from "@/components/glance-logo";
import { MailIcon } from "@/components/icons";
import { brand } from "@/lib/glance";
import { footerColumns, socialLinks } from "@/lib/nav";

/**
 * A calm, compact footer: the gold conversion band, then one quiet dark
 * block — brand left, three link columns, connect right — and a slim legal
 * bar. No ornament: the space does the talking.
 */
export function SiteFooter() {
  return (
    <footer className="mt-auto">
      {/* CTA band: one clear conversion before the directory. */}
      <div className="gold-band w-full bg-gradient-to-r from-gold-400 to-gold-500">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col items-start justify-between gap-6 px-5 py-10 sm:px-6 lg:flex-row lg:items-center lg:px-8">
          <div className="max-w-[520px]">
            <h2 className="text-[clamp(22px,3vw,30px)] leading-[1.12] font-extrabold tracking-[-0.02em] text-navy-950">
              Ready to lead the change on your campus?
            </h2>
            <p className="mt-2.5 text-[14.5px] leading-relaxed text-navy-950/75">
              Join a movement of young people building a stronger nation.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/join"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-navy-950 px-6 text-[13.5px] font-bold text-white transition-colors hover:bg-[#0e3163]"
            >
              Join GLANCE
            </Link>
            <Link
              href="/start-a-chapter"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-navy-950/30 px-6 text-[13.5px] font-bold text-navy-950 transition-colors hover:bg-navy-950/10"
            >
              Start a Chapter
            </Link>
          </div>
        </div>
      </div>

      <div className="navy-wash-footer w-full text-white">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-10 px-5 py-12 sm:px-6 lg:flex-row lg:gap-14 lg:px-8">
          {/* Brand */}
          <div className="max-w-[300px] shrink-0">
            <GlanceLogo variant="light" />
            <p className="mt-5 text-[13px] leading-[1.8] text-white/60">
              {brand.expansion} — a structured leadership and civic engagement
              club across tertiary institutions.
            </p>
            <a
              href={`mailto:${brand.contactEmail}`}
              className="mt-5 inline-flex items-center gap-2 text-[13px] font-semibold text-gold-400 transition-colors hover:text-gold-300"
            >
              <MailIcon className="h-4 w-4" />
              {brand.contactEmail}
            </a>
          </div>

          {/* Link columns */}
          <div className="grid flex-1 grid-cols-2 gap-10 sm:grid-cols-3">
            {footerColumns.map((column) => (
              <nav key={column.heading} aria-label={column.heading}>
                <h3 className="text-[11px] font-bold tracking-[0.18em] text-white/55 uppercase">
                  {column.heading}
                </h3>
                <ul className="mt-4 space-y-2.5 text-[13.5px] text-white/80">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="link-draw transition-colors hover:text-gold-400"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        {/* Legal bar */}
        <div className="border-t border-white/10">
          <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-3 px-5 py-5 text-[12.5px] text-white/55 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Link href="/privacy" className="transition-colors hover:text-white">
                Privacy Policy
              </Link>
              <span className="h-3 w-px bg-white/20" aria-hidden="true" />
              <Link href="/terms" className="transition-colors hover:text-white">
                Terms of Use
              </Link>
              <span className="h-3 w-px bg-white/20" aria-hidden="true" />
              {socialLinks.map((social, index) => (
                <span key={social.label} className="inline-flex items-center gap-3">
                  {index > 0 ? (
                    <span className="h-3 w-px bg-white/20" aria-hidden="true" />
                  ) : null}
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-white"
                  >
                    {social.label}
                  </a>
                </span>
              ))}
            </div>
            <p>
              © <CopyrightYear /> GLANCE. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
