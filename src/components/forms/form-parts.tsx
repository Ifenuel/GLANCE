"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { type FormState, type ValidationError } from "@/server/validation";

export { ButtonLink } from "@/components/ui";

/**
 * The one success confirmation pattern across the whole platform: an inline
 * line where the form is, *plus* a floating toast pinned at the bottom of the
 * viewport, so a submit that lands while the user is scrolled down — long
 * forms, phone screens — is confirmed at eye level without anyone scrolling
 * back to the top. The toast drops in with a GSAP-style rise and settles by
 * itself; it never traps the user.
 */
export function FormMessage({ state }: { state: FormState }) {
  // Success is a calm confirmation, never red.
  if (state.status === "success") {
    const message = state.success ?? state.message;
    if (!message) return null;
    return (
      <>
        <p
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-[12.5px] font-semibold text-emerald-700"
        >
          {message}
        </p>
        <SubmitToast message={message} tone="success" />
      </>
    );
  }
  // Field errors are string arrays; show the first message of the worst field.
  const firstError = state.errors ? Object.values(state.errors)[0] : null;
  const message =
    state.error ??
    (typeof firstError === "string"
      ? firstError
      : Array.isArray(firstError)
        ? firstError[0] ?? null
        : null) ??
    (state.status === "error" ? state.message ?? null : null);
  if (!message) return null;
  return (
    <>
      <p role="alert" className="text-[12.5px] font-semibold text-rose-600">{message}</p>
      <SubmitToast message={message} tone="error" />
    </>
  );
}

function SubmitToast({ message, tone }: { message: string; tone: "success" | "error" }) {
  const [visible, setVisible] = useState(false);
  const [dropped, setDropped] = useState(false);

  useEffect(() => {
    setVisible(true);
    const drop = window.setTimeout(() => setDropped(true), 30);
    const hide = window.setTimeout(() => setVisible(false), 6000);
    return () => {
      window.clearTimeout(drop);
      window.clearTimeout(hide);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-[10000] flex justify-center px-4 [transition:opacity_400ms_ease]"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div
        className={`pointer-events-auto flex max-w-[92vw] items-center gap-3 rounded-full border px-5 py-3 shadow-[0_24px_48px_-20px_rgba(5,37,80,0.45)] backdrop-blur [transition:transform_500ms_cubic-bezier(0.22,1,0.36,1)] ${
          tone === "success"
            ? "border-emerald-200 bg-emerald-600/95 text-white"
            : "border-rose-200 bg-rose-600/95 text-white"
        }`}
        style={{
          transform: dropped ? "translateY(0)" : "translateY(80px)",
        }}
      >
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
            tone === "success" ? "bg-white/20" : "bg-white/20"
          }`}
          aria-hidden="true"
        >
          {tone === "success" ? (
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
              <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
              <path d="M8 2a6 6 0 100 12A6 6 0 008 2zm.75 8.5h-1.5v-1.5h1.5v1.5zm0-3h-1.5v-3h1.5v3z" />
            </svg>
          )}
        </span>
        <p className="text-[13px] font-bold leading-snug">{message}</p>
      </div>
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  required,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  required?: boolean;
  error?: ValidationError | string | string[];
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="text-[12.5px] font-semibold text-ink-700"
      >
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </label>
      {hint ? <p className="text-[11.5px] leading-5 text-ink-400">{hint}</p> : null}
      {children}
      {error ? (
        <p role="alert" className="text-[11.5px] font-semibold text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput({
  id,
  name,
  type = "text",
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      id={id}
      name={name}
      type={type}
      className={`w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none ${className ?? ""}`}
      {...props}
    />
  );
}

export function TextArea({
  id,
  name,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      id={id}
      name={name}
      className={`w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none ${className ?? ""}`}
      {...props}
    />
  );
}

export function Select({
  id,
  name,
  options,
  defaultValue,
  className,
  placeholder,
  onChange,
  ...props
}: Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "defaultValue"> & {
  options: { value: string; label: string }[];
  defaultValue?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
}) {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange?.(event.target.value);
  };
  return (
    <select
      id={id}
      name={name}
      defaultValue={defaultValue}
      onChange={handleChange}
      className={`w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none ${className ?? ""}`}
      {...props}
    >
      {placeholder ? (
        <option value="" disabled>
          {placeholder}
        </option>
      ) : null}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function Checkbox({
  id,
  name,
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode }) {
  return (
    <label className={`flex items-start gap-3 text-[13.5px] leading-6 text-ink-600 ${className ?? ""}`}>
      <input
        id={id}
        name={name}
        type="checkbox"
        className="mt-0.5 h-4 w-4 rounded border-line text-navy-900 focus:ring-navy-500"
        {...props}
      />
      {label}
    </label>
  );
}

export function SubmitButton({
  pendingLabel,
  children,
  className,
  actionName,
  tone = "navy",
  type = "submit",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingLabel: string;
  actionName?: string;
  tone?: "navy" | "gold";
}) {
  const { pending } = useFormStatus();
  const tones = {
    navy: "bg-navy-900 text-white hover:bg-navy-800 focus:ring-navy-500/30",
    gold: "bg-[#EAAE14] text-navy-950 hover:bg-gold-500 focus:ring-gold-400/50",
  } as const;

  return (
    <button
      type={type}
      name={actionName}
      disabled={pending}
      aria-busy={pending}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg px-6 text-[13px] font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 ${tones[tone]} ${className ?? ""}`}
      {...props}
    >
      {pending ? (
        <RollingSpinner />
      ) : null}
      {pending ? pendingLabel : children}
      {!pending ? <ArrowRight className="h-4 w-4" /> : null}
    </button>
  );

  function RollingSpinner() {
    return (
      <span
        aria-hidden="true"
        className="inline-block h-4 w-4 animate-[spin_0.7s_linear_infinite] rounded-full border-2 border-white/35 border-t-white"
      />
    );
  }
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 8h10m0 0l-4-4m4 4l-4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
