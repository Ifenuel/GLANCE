"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateAccountAction } from "@/server/actions/member";
import { idleFormState } from "@/server/validation";

const STEPS = [
  { id: 1, label: "Change Password" },
  { id: 2, label: "Personal Details" },
  { id: 3, label: "Upload Photo" },
  { id: 4, label: "Review & Complete" },
];

export function FirstLoginOnboarding({
  user,
}: {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    phone?: string | null;
    gender?: string | null;
    department?: string | null;
    academicLevel?: string | null;
  };
}) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [personalData, setPersonalData] = useState({
    fullName: user.name || "",
    email: user.email || "",
    phoneNumber: user.phone || "",
    gender: user.gender || "MALE",
    department: user.department || "",
    academicLevel: user.academicLevel || "YEAR_1",
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict 10 KB limit as requested in brief and reference design
    if (file.size > 10 * 1024) {
      setError("File is too large! Maximum profile photo size is 10 KB.");
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleNext() {
    setError(null);
    if (currentStep === 1) {
      if (!passwordData.newPassword || passwordData.newPassword.length < 8) {
        setError("New password must be at least 8 characters long.");
        return;
      }
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!personalData.fullName.trim()) {
        setError("Please enter your full name.");
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    } else if (currentStep === 4) {
      setLoading(true);
      try {
        const formData = new FormData();
        formData.append("name", personalData.fullName);
        formData.append("phone", personalData.phoneNumber);
        formData.append("gender", personalData.gender);
        formData.append("department", personalData.department);
        formData.append("academicLevel", personalData.academicLevel);
        formData.append("completeProfile", "on");

        await updateAccountAction(idleFormState, formData);
        router.push("/portal/dashboard");
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to complete onboarding.");
        setLoading(false);
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#071633] text-white flex flex-col justify-center items-center p-4 py-12">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-[#091e42] shadow-2xl">
        <div className="border-b border-white/10 px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold-400 font-bold text-navy-950 text-xs">
              08
            </span>
            <h1 className="text-lg font-bold tracking-tight">First Login Onboarding</h1>
          </div>
          <span className="text-xs text-white/50">GLANCE Network</span>
        </div>

        <div className="grid md:grid-cols-[260px_1fr]">
          {/* Sidebar Steps */}
          <div className="border-r border-white/10 bg-[#06142e]/60 p-6">
            <ul className="space-y-4">
              {STEPS.map((s) => (
                <li
                  key={s.id}
                  className={`flex items-center gap-3 rounded-lg p-2.5 text-xs font-semibold transition-all ${
                    currentStep === s.id
                      ? "bg-gold-400/10 text-gold-400 border border-gold-400/30"
                      : currentStep > s.id
                      ? "text-emerald-400"
                      : "text-white/40"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                      currentStep === s.id
                        ? "bg-gold-400 text-navy-950"
                        : currentStep > s.id
                        ? "bg-emerald-500 text-white"
                        : "bg-white/10 text-white/40"
                    }`}
                  >
                    {currentStep > s.id ? "✓" : s.id}
                  </span>
                  <span>{s.label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Form Content Area */}
          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">
                {currentStep === 1 && "Change Your Temporary Password"}
                {currentStep === 2 && "Enter Your Personal Details"}
                {currentStep === 3 && "Upload Profile Photo"}
                {currentStep === 4 && "Review & Complete"}
              </h2>
              <p className="mt-1 text-xs text-white/60">
                Complete your administrator profile setup to access the GLANCE dashboard.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-rose-500/15 border border-rose-500/30 p-3 text-xs text-rose-300">
                {error}
              </div>
            )}

            {/* Step 1: Change Password */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-white/80">Current / Temporary Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                    className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder:text-white/40 focus:border-gold-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/80">New Password (Min 8 characters)</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Enter new strong password"
                    className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder:text-white/40 focus:border-gold-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/80">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                    className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder:text-white/40 focus:border-gold-400 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Personal Details */}
            {currentStep === 2 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-white/80">Full Name</label>
                  <input
                    type="text"
                    value={personalData.fullName}
                    onChange={(e) => setPersonalData({ ...personalData, fullName: e.target.value })}
                    placeholder="Your official full name"
                    className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder:text-white/40 focus:border-gold-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/80">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={personalData.email}
                    className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white/50 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/80">Phone Number</label>
                  <input
                    type="tel"
                    value={personalData.phoneNumber}
                    onChange={(e) => setPersonalData({ ...personalData, phoneNumber: e.target.value })}
                    placeholder="e.g. 08012345678"
                    className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder:text-white/40 focus:border-gold-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/80">Gender</label>
                  <select
                    value={personalData.gender}
                    onChange={(e) => setPersonalData({ ...personalData, gender: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-white/20 bg-[#06142e] px-3.5 py-2.5 text-xs text-white focus:border-gold-400 focus:outline-none"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/80">Department</label>
                  <input
                    type="text"
                    value={personalData.department}
                    onChange={(e) => setPersonalData({ ...personalData, department: e.target.value })}
                    placeholder="e.g. Political Science / Secretariat"
                    className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder:text-white/40 focus:border-gold-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/80">Academic Level / Title</label>
                  <select
                    value={personalData.academicLevel}
                    onChange={(e) => setPersonalData({ ...personalData, academicLevel: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-white/20 bg-[#06142e] px-3.5 py-2.5 text-xs text-white focus:border-gold-400 focus:outline-none"
                  >
                    <option value="YEAR_1">Year 1</option>
                    <option value="YEAR_2">Year 2</option>
                    <option value="YEAR_3">Year 3</option>
                    <option value="YEAR_4">Year 4</option>
                    <option value="YEAR_5">Year 5</option>
                    <option value="OTHER">Staff / Executive</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 3: Upload Photo */}
            {currentStep === 3 && (
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-32 w-32 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-white/20 bg-white/5">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="p-4 text-center text-white/40">
                      <svg className="mx-auto h-8 w-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="mt-1 block text-[11px]">Upload Photo</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="inline-block cursor-pointer rounded-lg bg-gold-400 px-4 py-2 text-xs font-bold text-navy-950 hover:bg-gold-300">
                    Choose File
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  </label>
                  <p className="mt-2 text-[11px] text-white/50">
                    Maximum photo size: <strong className="text-gold-400">10 KB</strong> (as required by GLANCE ID specs).
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Review & Complete */}
            {currentStep === 4 && (
              <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-5 text-xs">
                <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                  {photoPreview && (
                    <img src={photoPreview} alt="Avatar" className="h-14 w-14 rounded-full object-cover border border-gold-400" />
                  )}
                  <div>
                    <h3 className="text-sm font-bold text-white">{personalData.fullName}</h3>
                    <p className="text-white/60">{personalData.email}</p>
                    <span className="inline-block mt-1 rounded bg-gold-400/20 px-2 py-0.5 text-[10px] font-semibold text-gold-400">
                      {user.role}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-white/70">
                  <div>
                    <span className="block text-[10px] text-white/40 uppercase">Phone</span>
                    <span>{personalData.phoneNumber || "Not provided"}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-white/40 uppercase">Gender</span>
                    <span>{personalData.gender}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-white/40 uppercase">Department</span>
                    <span>{personalData.department || "General"}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-white/40 uppercase">Level</span>
                    <span>{personalData.academicLevel}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-4">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((s) => s - 1)}
                  className="rounded-lg border border-white/20 px-4 py-2 text-xs font-semibold text-white/80 hover:bg-white/10"
                >
                  Back
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="rounded-lg bg-gold-400 px-6 py-2.5 text-xs font-bold text-navy-950 shadow-md hover:bg-gold-300 disabled:opacity-50"
              >
                {loading ? "Completing..." : currentStep === 4 ? "Complete & Go to Dashboard" : "Next →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
