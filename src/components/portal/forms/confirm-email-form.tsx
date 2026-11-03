"use client";

import { useActionState } from "react";
import { FormMessage, SubmitButton } from "@/components/forms/form-parts";
import { confirmEmailChangeAction } from "@/server/actions/member";
import { idleFormState } from "@/server/validation";

/**
 * The click behind the email-change confirmation link: one button, one
 * outcome. Anything wrong with the link (invalid, expired, signature voided
 * by a password change) is answered by the server action itself.
 */
export function ConfirmEmailForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(
    confirmEmailChangeAction,
    idleFormState,
  );

  if (state.status === "success") {
    return <FormMessage state={state} />;
  }

  return (
    <form action={formAction} className="space-y-5 text-center">
      <FormMessage state={state} />
      <input type="hidden" name="token" value={token} readOnly />
      <SubmitButton pendingLabel="Confirming…" className="w-full">
        Confirm my email address
      </SubmitButton>
      <p className="text-[11.5px] leading-5 text-white/50">
        If the link has expired, open the portal, save your account details
        again and a fresh one will be sent.
      </p>
    </form>
  );
}
