"use client";

import { useState } from "react";
import {
  nigerianInstitutions,
  nigerianStates,
} from "@/lib/institutions";

/**
 * Grouped institution picker for the join form.
 *
 * One real <select> with deduplicated, alphabetically sorted suggestions —
 * Federal, State and Private universities, Polytechnics, Colleges of
 * Education — so a visitor can pick rather than type. Choosing "My
 * institution is not listed" reveals a free-text input so anyone whose
 * institution is missing can type it out.
 */
export function InstitutionPicker({
  id = "institution",
  name = "institution",
  required = true,
}: {
  id?: string;
  name?: string;
  required?: boolean;
}) {
  const [mode, setMode] = useState<"select" | "custom">("select");
  const [customValue, setCustomValue] = useState("");

  return (
    <div className="space-y-2">
      <select
        id={id}
        name={mode === "select" ? name : undefined}
        required={required && mode === "select"}
        defaultValue=""
        onChange={(event) => {
          const value = event.target.value;
          if (value === "__custom__") {
            setMode("custom");
          } else {
            setMode("select");
          }
        }}
        className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
      >
        <option value="" disabled>
          Select your institution
        </option>
        {nigerianInstitutions.map((institution) => (
          <option key={institution} value={institution}>
            {institution}
          </option>
        ))}
        <option value="__custom__">My institution is not listed</option>
      </select>

      {mode === "custom" ? (
        <input
          id={`${id}-custom`}
          name={name}
          type="text"
          required={required}
          value={customValue}
          onChange={(event) => setCustomValue(event.target.value)}
          placeholder="Type your institution name"
          className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
        />
      ) : null}
    </div>
  );
}

/** Grouped state picker: all 36 states plus the FCT, with a type-out fallback. */
export function StatePicker({
  id = "state",
  name = "state",
  required = true,
}: {
  id?: string;
  name?: string;
  required?: boolean;
}) {
  const [mode, setMode] = useState<"select" | "custom">("select");

  return (
    <div className="space-y-2">
      <select
        id={id}
        name={mode === "select" ? name : undefined}
        required={required && mode === "select"}
        defaultValue=""
        onChange={(event) => {
          setMode(event.target.value === "__custom__" ? "custom" : "select");
        }}
        className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
      >
        <option value="" disabled>
          Select your state
        </option>
        {nigerianStates.map((state) => (
          <option key={state} value={state}>
            {state}
          </option>
        ))}
        <option value="__custom__">Not listed</option>
      </select>

      {mode === "custom" ? (
        <input
          id={`${id}-custom`}
          name={name}
          type="text"
          required={required}
          placeholder="Type your state"
          className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
        />
      ) : null}
    </div>
  );
}
