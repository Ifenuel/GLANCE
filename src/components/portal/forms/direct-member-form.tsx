"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Field, SubmitButton } from "@/components/forms/form-parts";
import { registerDirectMemberAction } from "@/server/actions/member-admin";
import { idleFormState, type FormState } from "@/server/validation";
import { GlanceMark } from "@/components/glance-logo";

type ChapterOption = { id: string; name: string; code: string; institution: string };

type SubmitIntent = "save" | "id-card";

/** Success banner that stays pinned to the top of the viewport until dismissed. */
function SuccessBanner({
  headline,
  detail,
  linkHref,
  linkLabel,
  onDismiss,
}: {
  headline: string;
  detail: string;
  linkHref?: string;
  linkLabel?: string;
  onDismiss: () => void;
}) {
  return (
    <div
      role="status"
      className="sticky top-2 z-30 flex flex-wrap items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 shadow-[0_10px_40px_-20px_rgba(16,94,60,0.5)]"
    >
      <span
        aria-hidden="true"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[13px] font-black text-white"
      >
        ✓
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-bold text-emerald-800">{headline}</p>
        <p className="text-[12px] text-emerald-700">{detail}</p>
      </div>
      {linkHref ? (
        <a
          href={linkHref}
          className="rounded-lg bg-emerald-700 px-3.5 py-2 text-[12px] font-bold text-white transition-colors hover:bg-emerald-800"
        >
          {linkLabel ?? "View"}
        </a>
      ) : null}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss confirmation"
        className="rounded-md px-2 py-1 text-[16px] leading-none text-emerald-700/70 transition-colors hover:text-emerald-800"
      >
        ×
      </button>
    </div>
  );
}

const errorBanner = (state: FormState) => {
  if (state.status !== "error") return null;
  const message =
    state.error ??
    (state.errors ? Object.values(state.errors)[0]?.[0] ?? null : null) ??
    (state.message ? null : null);
  if (!message) return null;
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
      <span aria-hidden="true" className="mt-0.5 text-[15px] leading-none text-rose-500">
        ⚠
      </span>
      <div>
        <p className="text-[12.5px] font-bold text-rose-700">{message}</p>
        {state.errors && Object.keys(state.errors).length > 0 ? (
          <p className="text-[12px] text-rose-600">
            Check the highlighted fields below.
          </p>
        ) : null}
      </div>
    </div>
  );
};

const inputClass =
  "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none";

const academicOptions = [
  { value: "", label: "Select level" },
  { value: "YEAR_1", label: "Year 1" },
  { value: "YEAR_2", label: "Year 2" },
  { value: "YEAR_3", label: "Year 3" },
  { value: "YEAR_4", label: "Year 4" },
  { value: "YEAR_5", label: "Year 5" },
  { value: "ND", label: "National Diploma (ND)" },
  { value: "HND", label: "Higher National Diploma (HND)" },
  { value: "PGD", label: "Postgraduate Diploma" },
  { value: "MASTERS", label: "Master's degree" },
  { value: "DOCTORATE", label: "Doctorate" },
  { value: "OTHER", label: "Other" },
];

const genderOptions = [
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
  { value: "FEMALE", label: "Female" },
  { value: "MALE", label: "Male" },
  { value: "OTHER", label: "Other" },
];

const categoryOptions = [
  { value: "STUDENT", label: "Student" },
  { value: "NON_STUDENT", label: "Non-student participant" },
  { value: "ALUMNI", label: "Alumni" },
];

export function DirectMemberForm({
  chapters,
  fixedChapterLabel,
  idCardHref,
}: {
  /** Shown only to network officers; chapter admins get their own chapter. */
  chapters: ChapterOption[];
  /** Human label of the chapter when it is fixed by the server role. */
  fixedChapterLabel: string | null;
  /** Fallback link when the member's own ID-card URL is not part of the response. */
  idCardHref: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const intentRef = useRef<SubmitIntent>("save");
  const [state, formAction] = useActionState(registerDirectMemberAction, idleFormState);
  const [notice, setNotice] = useState<
    { headline: string; detail: string; linkHref?: string; linkLabel?: string } | null
  >(null);

  // Success feedback: stay on page with a pinned confirmation, or jump straight
  // to the member's digital ID card when the user picked that button.
  useEffect(() => {
    if (state.status !== "success") return;
    const memberId = state.result?.memberId ?? null;
    const memberCode = state.result?.memberCode ?? null;
    if (intentRef.current === "id-card" && memberId) {
      router.push(`/portal/members/${memberId}/id-card`);
      return;
    }
    setNotice({
      headline: "Member registered",
      detail: state.success ?? state.message ?? "Saved.",
      linkHref: memberId ? `${idCardHref}/${memberId}/id-card` : undefined,
      linkLabel: memberCode ? "View ID card" : "View member",
    });
    formRef.current?.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const dismissNotice = () => setNotice(null);

  function Select({ name, options }: { name: string; options: { value: string; label: string }[] }) {
    return (
      <select name={name} className={inputClass} required={name === "academicLevel"}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      {notice ? (
        <SuccessBanner
          headline={notice.headline}
          detail={notice.detail}
          linkHref={notice.linkHref}
          linkLabel={notice.linkLabel}
          onDismiss={dismissNotice}
        />
      ) : null}
      {errorBanner(state)}

      {/* Step 1 — identity */}
      <fieldset className="space-y-4 rounded-xl border border-line bg-white p-5">
        <legend className="px-2 text-[11px] font-bold tracking-[0.16em] text-gold-600 uppercase">
          1 · Identity
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="fullName" required error={state.errors?.fullName?.[0]}>
            <input id="fullName" name="fullName" required autoComplete="name" placeholder="Jumoke Oduwole" className={inputClass} />
          </Field>
          <Field label="Email address" htmlFor="email" required error={state.errors?.email?.[0]}>
            <input id="email" name="email" type="email" required autoComplete="email" placeholder="you@institution.edu.ng" className={inputClass} />
          </Field>
          <Field label="Phone number" htmlFor="phone" error={state.errors?.phone?.[0]}>
            <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="080 1234 5678" className={inputClass} />
          </Field>
          <Field label="Gender" htmlFor="gender" error={state.errors?.gender?.[0]}>
            <Select name="gender" options={genderOptions} />
          </Field>
        </div>
      </fieldset>

      {/* Step 2 — placement */}
      <fieldset className="space-y-4 rounded-xl border border-line bg-white p-5">
        <legend className="px-2 text-[11px] font-bold tracking-[0.16em] text-gold-600 uppercase">
          2 · Chapter placement
        </legend>
        {fixedChapterLabel ? (
          <div className="flex items-center gap-3 rounded-lg border border-line bg-navy-50/60 px-3.5 py-2.5">
            <span className="flex h-6 items-center justify-center rounded bg-navy-950 text-gold-400">
              <GlanceMark className="h-4 w-auto" />
            </span>
            <span className="text-[13px] font-bold text-navy-900">{fixedChapterLabel}</span>
            <span className="text-[11px] text-ink-400">(your assigned chapter)</span>
          </div>
        ) : (
          <Field label="Chapter" htmlFor="chapterId" required error={state.errors?.chapterId?.[0]}>
            <select
              id="chapterId"
              name="chapterId"
              required
              className={inputClass}
            >
              <option value="">Choose the chapter</option>
              {chapters.map((chapter) => (
                <option key={chapter.id} value={chapter.id}>
                  {chapter.name} ({chapter.code}) — {chapter.institution}
                </option>
              ))}
            </select>
          </Field>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Membership category" htmlFor="membershipCategory" error={state.errors?.membershipCategory?.[0]}>
            <Select name="membershipCategory" options={categoryOptions} />
          </Field>
        </div>
      </fieldset>

      {/* Step 3 — academics */}
      <fieldset className="space-y-4 rounded-xl border border-line bg-white p-5">
        <legend className="px-2 text-[11px] font-bold tracking-[0.16em] text-gold-600 uppercase">
          3 · Academic record
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Department or field"
            htmlFor="department"
            error={state.errors?.department?.[0]}
            hint="For example: Political Science"
          >
            <input id="department" name="department" placeholder="Department" className={inputClass} />
          </Field>
          <Field
            label="Academic level"
            htmlFor="academicLevel"
            required
            error={state.errors?.academicLevel?.[0]}
          >
            <Select name="academicLevel" options={academicOptions} />
          </Field>
          <Field
            label="Matriculation / student number"
            htmlFor="matricNo"
            hint="Optional — shown on records, never published publicly."
            error={state.errors?.matricNo?.[0]}
          >
            <input id="matricNo" name="matricNo" placeholder="e.g. 2019/00421" className={inputClass} />
          </Field>
          <Field
            label="Position in chapter"
            htmlFor="position"
            hint="Leave blank for a general member."
            error={state.errors?.position?.[0]}
          >
            <input id="position" name="position" placeholder="e.g. President" className={inputClass} />
          </Field>
        </div>
      </fieldset>

      <div className="rounded-xl border border-line bg-navy-50/50 px-4 py-3 text-[12px] leading-5 text-ink-500">
        Every member keeps one permanent GLANCE ID for life — even when they
        graduate, change chapter or return as alumni. The digital ID card can
        be printed or downloaded at any time from the member's page, after an
        avatar photo is uploaded.
      </div>

      <div className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-center">
        <input type="hidden" name="submitIntent" value="save" />
        <SubmitButton
          pendingLabel="Registering member…"
          onClick={() => {
            intentRef.current = "save";
          }}
        >
          Register member
        </SubmitButton>
        <SubmitButton
          pendingLabel="Opening ID card…"
          tone="gold"
          className="!bg-white !text-navy-900 border border-navy-900/30 hover:!bg-navy-50"
          onClick={() => {
            intentRef.current = "id-card";
            const hidden = formRef.current?.elements.namedItem("submitIntent");
            if (hidden instanceof HTMLInputElement) hidden.value = "id-card";
          }}
        >
          Register &amp; open ID card
        </SubmitButton>
        <p className="text-[11.5px] leading-4 text-ink-400">
          Register now, or register and go straight to the member's digital
          ID card.
        </p>
      </div>
    </form>
  );
}
