import Link from "next/link";

/**
 * The branded 404. An unknown URL lands here instead of the framework's
 * default white slab: one calm headline, the way back to the pages that
 * matter, and no technical language.
 */
export const metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <main className="navy-wash flex min-h-[80vh] items-center justify-center px-5 py-20">
      <div className="w-full max-w-[460px] text-center">
        <p className="text-[11px] font-bold tracking-[0.22em] text-gold-400 uppercase">
          GLANCE
        </p>
        <h1 className="mt-4 text-[30px] leading-[1.15] font-extrabold tracking-[-0.02em] text-white sm:text-[36px]">
          We couldn&apos;t find that page.
        </h1>
        <p className="mt-4 text-[14.5px] leading-[1.8] text-white/70">
          The link may be old or mistyped. Everything the network offers is
          still one click away.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-gold-400 px-6 text-[13px] font-bold text-navy-900 transition-colors hover:bg-gold-500"
          >
            Back to the homepage
          </Link>
          <Link
            href="/contact"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-white/25 px-6 text-[13px] font-bold text-white transition-colors hover:border-white/50 hover:bg-white/10"
          >
            Contact the secretariat
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-x-5 gap-y-2 border-t border-white/15 pt-5 text-[12.5px] text-white/60">
          <Link href="/about" className="underline underline-offset-4 hover:text-white">
            About GLANCE
          </Link>
          <Link href="/chapters" className="underline underline-offset-4 hover:text-white">
            Chapters
          </Link>
          <Link href="/join" className="underline underline-offset-4 hover:text-white">
            Join
          </Link>
          <Link href="/news" className="underline underline-offset-4 hover:text-white">
            News
          </Link>
        </div>
      </div>
    </main>
  );
}
