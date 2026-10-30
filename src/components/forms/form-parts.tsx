"use client";

import { useFormStatus } from "react-dom";
import { type FormState, type ValidationError } from "@/server/validation";

export { ButtonLink } from "@/components/ui";

export function FormMessage({ state }: { state: FormState }) {
  // Success is a calm confirmation, never red.
  if (state.status === "success") {
    const message = state.success ?? state.message;
    if (!message) return null;
    return (
      <p
        role="status"
        className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-[12.5px] font-semibold text-emerald-700"
      >
        {message}
      </p>
    );
  }
  const message =
    state.error ??
    (state.errors ? Object.values(state.errors)[0] ?? null : null) ??
    (state.status === "error" ? state.message ?? null : null);
  if (!message) return null;
  return <p role="alert" className="text-[12.5px] font-semibold text-rose-600">{message}</p>;
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
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg px-6 text-[13px] font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 ${tones[tone]} ${className ?? ""}`}
      {...props}
    >
      {pending ? pendingLabel : children}
      {!pending ? <ArrowRight className="h-4 w-4" /> : null}
    </button>
  );
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
