"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  Checkbox,
  Field,
  FormMessage,
  Select,
  SubmitButton,
  TextArea,
  TextInput,
} from "@/components/forms/form-parts";
import {
  InstitutionPicker,
  StatePicker,
} from "@/components/forms/institution-picker";
import {
  trackMembershipApplicationResult,
  trackMembershipApplicationStarted,
} from "@/lib/analytics/product";
import { submitJoinApplicationAction } from "@/server/actions/public";
import { idleFormState } from "@/server/validation";

const academicOptions = [
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

const categoryOptions = [
  { value: "STUDENT", label: "Student" },
  { value: "NON_STUDENT", label: "Non-student participant" },
  { value: "ALUMNI", label: "Alumni" },
];

const genderOptions = [
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
  { value: "FEMALE", label: "Female" },
  { value: "MALE", label: "Male" },
  { value: "OTHER", label: "Other" },
];

export function JoinForm({ chapterCodes }: { chapterCodes: string[] }) {
  const [state, formAction] = useActionState(submitJoinApplicationAction, idleFormState);
  const [category, setCategory] = useState("STUDENT");
  const formRef = useRef<HTMLFormElement>(null);
  const draftRef = useRef<Record<string, string | boolean>>({});

  // React resets the form after every action — including a failed one — so a
  // validation error would wipe everything the applicant already typed. Keep a
  // silent draft and restore it whenever the action answers with an error.
  function noteDraft() {
    const form = formRef.current;
    if (!form) return;
    const draft: Record<string, string | boolean> = {};
    for (const el of Array.from(form.elements)) {
      if (
        !(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) ||
        !el.name
      )
        continue;
      draft[el.name] =
        el instanceof HTMLInputElement && el.type === "checkbox" ? el.checked : el.value;
    }
    draftRef.current = draft;
  }

  // Funnel: the first interaction starts it, the action's answer ends it.
  // Consent, property filtering and failure swallowing live in the analytics
  // module; nothing here can change what the form does.
  const started = useRef(false);
  const reported = useRef(state);

  useEffect(() => {
    if (state === reported.current) return;
    reported.current = state;
    trackMembershipApplicationResult(state, category);
  }, [state, category]);

  useEffect(() => {
    if (state.status !== "error" || !formRef.current) return;
    for (const [name, value] of Object.entries(draftRef.current)) {
      const el = formRef.current.elements.namedItem(name);
      if (el instanceof HTMLInputElement && el.type === "checkbox") {
        el.checked = value === true;
      } else if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement
      ) {
        el.value = String(value);
      }
    }
  }, [state]);

  function noteStart() {
    if (started.current) return;
    started.current = true;
    trackMembershipApplicationStarted(category);
  }

  const errors = state.errors ?? {};
  const isAlumni = category === "ALUMNI";
  const isStudent = category === "STUDENT";

  return (
    <form
      ref={formRef}
      action={formAction}
      onFocusCapture={noteStart}
      onPointerDownCapture={noteStart}
      onInputCapture={noteDraft}
      onChangeCapture={noteDraft}
      className="space-y-8"
    >
      <FormMessage state={state} />

      {/* Section 1: who you are */}
      <fieldset className="space-y-5">
        <legend className="text-[11px] font-bold tracking-[0.18em] text-gold-600 uppercase">
          About you
        </legend>
        <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" htmlFor="fullName" required error={errors.fullName?.[0]}>
          <TextInput id="fullName" name="fullName" required autoComplete="name" />
        </Field>
        <Field label="Email address" htmlFor="email" required error={errors.email?.[0]}>
          <TextInput id="email" name="email" type="email" required autoComplete="email" />
        </Field>
        <Field label="Phone number" htmlFor="phone" required error={errors.phone?.[0]}>
          <TextInput id="phone" name="phone" type="tel" required autoComplete="tel" inputMode="tel" />
        </Field>
        </div>
      </fieldset>

      {/* Section 2: where you study or serve */}
      <fieldset className="space-y-5">
        <legend className="text-[11px] font-bold tracking-[0.18em] text-gold-600 uppercase">
          Institution &amp; chapter
        </legend>
        <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Institution or community"
          htmlFor="institution"
          required
          error={errors.institution?.[0]}
          hint="Grouped federal / state / private — or type it if it is not listed."
        >
          <InstitutionPicker id="institution" name="institution" required />
        </Field>
        <Field
          label="State"
          htmlFor="state"
          required
          hint="Choose your state, or type it if it is not listed."
          error={errors.state?.[0]}
        >
          <StatePicker id="state" name="state" required />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Membership category"
          htmlFor="membershipCategory"
          required
          error={errors.membershipCategory?.[0]}
          hint="Alumni and non-student participants follow the same pathway."
        >
          <Select
            id="membershipCategory"
            name="membershipCategory"
            options={categoryOptions}
            required
            defaultValue="STUDENT"
            onChange={setCategory}
          />
        </Field>
        <Field
          label="Chapter code"
          htmlFor="chapterCode"
          hint="Optional: the GLANCE chapter you are applying to, for example GLN-UI-001."
          error={errors.chapterCode?.[0]}
        >
          <TextInput
            id="chapterCode"
            name="chapterCode"
            placeholder={chapterCodes[0] ?? "GLN-UI-001"}
            maxLength={40}
          />
        </Field>
      </div>
      </fieldset>

      {/* Section 3: your background */}
      <fieldset className="space-y-5">
        <legend className="text-[11px] font-bold tracking-[0.18em] text-gold-600 uppercase">
          Your background
        </legend>
        <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Department or field"
          htmlFor="department"
          hint={isStudent ? "For example: Political Science" : "Optional"}
          error={errors.department?.[0]}
        >
          <TextInput id="department" name="department" />
        </Field>
        <Field
          label="Academic level"
          htmlFor="academicLevel"
          hint={
            isStudent
              ? "Conditional on being a current student."
              : "Leave as not applicable if you are not studying."
          }
          error={errors.academicLevel?.[0]}
        >
          <Select
            id="academicLevel"
            name="academicLevel"
            options={academicOptions}
            placeholder={isStudent ? "Select your level" : "Not applicable"}
          />
        </Field>
      </div>

        <Field
          label={isAlumni ? "Gender (optional)" : "Gender"}
          htmlFor="gender"
          hint="You may decline disclosure. Administrators only use this for reporting."
          error={errors.gender?.[0]}
        >
          <Select
            id="gender"
            name="gender"
            options={genderOptions}
            defaultValue="PREFER_NOT_TO_SAY"
          />
        </Field>
      </fieldset>

      {/* Section 4: motivation and consent */}
      <fieldset className="space-y-5">
        <legend className="text-[11px] font-bold tracking-[0.18em] text-gold-600 uppercase">
          Your motivation
        </legend>
      <Field
        label="Why do you want to join GLANCE?"
        htmlFor="motivation"
        required
        error={errors.motivation?.[0]}
        hint="Tell us what you want to contribute and where you want to serve."
      >
        <TextArea id="motivation" name="motivation" rows={6} required maxLength={2000} />
      </Field>

      <Checkbox
        id="consent"
        name="consent"
        required
        label={
          <>
            I consent to GLANCE storing and processing the personal
            information in this application for the purpose of membership
            administration. I understand that GLANCE and my chapter&apos;s coordinators can see my
            record and that my details are not published publicly.
          </>
        }
      />
      {errors.consent?.[0] ? (
        <p role="alert" className="text-[12px] font-semibold text-rose-600">
          {errors.consent[0]}
        </p>
      ) : null}
      </fieldset>

      <SubmitButton pendingLabel="Submitting application…">
        Submit membership application
      </SubmitButton>
    </form>
  );
}
