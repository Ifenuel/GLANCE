"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { GlanceMark } from "@/components/glance-logo";

/**
 * Forced profile completion for staff accounts created by invitation.
 *
 * While `needed` is true, every portal route except /portal/profile redirects
 * there. The officer, communication manager or chapter administrator must
 * fill in name, gender, department, level, position, email and phone before
 * the rest of the portal opens. The server enforces the same rule (the
 * completion action is the only thing that stamps profileCompletedAt), so
 * this component is the visible half of that contract, not the only lock.
 */
export function ProfileGate({
  needed,
  name,
}: {
  needed: boolean;
  name: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const onProfile = pathname === "/portal/profile";

  useEffect(() => {
    if (needed && !onProfile) {
      router.replace("/portal/profile");
    }
  }, [needed, onProfile, router]);

  if (!needed || onProfile) return null;

  // Rendered only during the frame before the redirect lands: a calm holding
  // screen so a half-painted dashboard never flashes behind the gate.
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#f7f9fc]/90 backdrop-blur-sm">
      <div className="w-[min(380px,90vw)] rounded-2xl border border-line bg-white p-7 text-center shadow-[0_30px_70px_-40px_rgba(5,42,92,0.5)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-900">
          <GlanceMark tone="light" height={26} />
        </div>
        <h2 className="mt-4 text-[18px] font-extrabold tracking-tight text-navy-900">
          Finish setting up your account
        </h2>
        <p className="mt-2 text-[13px] leading-[1.7] text-ink-500">
          Welcome, {name.split(" ")[0] || "there"}. Please confirm your details
          before using the portal.
        </p>
        <Link
          href="/portal/profile"
          className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-navy-900 px-6 text-[13px] font-bold text-white transition-colors hover:bg-navy-950"
        >
          Complete my profile
        </Link>
      </div>
    </div>
  );
}
