import type { Metadata } from "next";
import { AuthCard, AuthBackLink } from "@/components/portal/auth-card";
import { InvitationAcceptanceForm } from "@/components/portal/forms";

export const metadata: Metadata = {
  title: "Activate account",
  description: "Activate your GLANCE portal account with an invitation code.",
};

export default function ActivatePage() {
  return (
    <AuthCard
      title="Activate your account"
      subtitle={
        <>
          Enter the invitation or activation code sent by GLANCE or your chapter
          administrator to create your portal account.
        </>
      }
      footer={
        <>
          Already activated?{" "}
          <AuthBackLink href="/portal/login">Sign in</AuthBackLink>
        </>
      }
    >
      <InvitationAcceptanceForm />
    </AuthCard>
  );
}
