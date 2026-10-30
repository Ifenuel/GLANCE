import type { Metadata } from "next";
import { AuthCard, AuthBackLink } from "@/components/portal/auth-card";
import { ResetPasswordForm } from "@/components/portal/forms";

export const metadata: Metadata = {
  title: "Set new password",
  description: "Set a new password for your GLANCE portal account.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token || token.length < 10) {
    return (
      <AuthCard
        title="Link not valid"
        subtitle={
          <>
            This password reset link is incomplete or has expired. Request a
            fresh link to continue.
          </>
        }
        footer={
          <AuthBackLink href="/portal/forgot-password">
            Request a new link
          </AuthBackLink>
        }
      >
        <p role="alert" className="text-[13px] font-semibold text-rose-600">
          Open the link from your most recent reset email, or request a new one.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Set a new password"
      subtitle={
        <>
          Choose a strong password for your GLANCE portal account. All existing
          sessions will be signed out.
        </>
      }
      footer={
        <AuthBackLink href="/portal/login">Back to sign in</AuthBackLink>
      }
    >
      <ResetPasswordForm token={token} />
    </AuthCard>
  );
}
