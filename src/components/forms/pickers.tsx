"use client";

import {
  nigerianInstitutions,
  nigerianStates,
} from "@/lib/institutions";

/**
 * Suggestion lists for the application inputs. The fields stay ordinary free
 * text: anyone can pick a suggestion or type an institution or state that is
 * not on the list yet.
 */
export function InstitutionDatalist() {
  return (
    <datalist id="nigerian-institutions">
      {nigerianInstitutions.map((institution) => (
        <option key={institution} value={institution} />
      ))}
    </datalist>
  );
}

export function StateDatalist() {
  return (
    <datalist id="nigerian-states">
      {nigerianStates.map((state) => (
        <option key={state} value={state} />
      ))}
    </datalist>
  );
}
