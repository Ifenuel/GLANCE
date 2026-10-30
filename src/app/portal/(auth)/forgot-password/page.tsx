import type { Metadata } from "next";
import { AuthCard, AuthBackLink } from "@/components/portal/auth-card";
import { ForgotPasswordForm } from "@/components/portal/forms";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Request a password reset link for your GLANCE portal account.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      subtitle={
        <>
          We&apos;ll email you a secure link to set a new password for your
          GLANCE portal account.
        </>
      }
      footer={
        <>
          Remembered it?{" "}
          <AuthBackLink href="/portal/login">Back to sign in</AuthBackLink>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
