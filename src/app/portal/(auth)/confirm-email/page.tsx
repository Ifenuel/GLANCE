import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmEmailForm } from "@/components/portal/forms/confirm-email-form";

export const metadata: Metadata = {
  title: "Confirm email | GLANCE Portal",
  description: "Confirm the new email address for your GLANCE account.",
};

/**
 * Arrivals from the confirmation link in the account holder's inbox. The
 * token travels to a server action that re-verifies the signature before
 * anything changes; nothing here is writable by URL alone.
 */
export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-[440px] flex-col justify-center px-6 py-16">
      <div className="rounded-2xl border border-navy-800 bg-navy-950 p-8 text-white">
        <p className="text-[10.5px] font-bold tracking-[0.24em] text-gold-400 uppercase">
          Account security
        </p>
        <h1 className="mt-3 text-[22px] font-extrabold leading-tight tracking-[-0.02em]">
          Confirm your new email address
        </h1>
        <p className="mt-2 text-[12.5px] leading-[1.7] text-white/60">
          This link was sent because someone asked to move a GLANCE account to
          a new address. Until a link is confirmed, the account keeps its
          current address and sign-in.
        </p>

        <div className="mt-7">
          {token ? (
            <ConfirmEmailForm token={token} />
          ) : (
            <p className="text-[13px] font-semibold text-rose-300">
              This page was opened without a confirmation token — use the link
              from the email exactly as it was sent.
            </p>
          )}
        </div>

        <div className="mt-8 border-t border-white/10 pt-5">
          <Link
            href="/portal/login"
            className="text-[12.5px] font-bold text-gold-300 underline decoration-gold-400/50 underline-offset-4 hover:text-gold-200"
          >
            ← Back to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
