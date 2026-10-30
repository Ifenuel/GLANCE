import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { FirstLoginOnboarding } from "@/components/portal/first-login-onboarding";

export const metadata: Metadata = {
  title: "First Login Onboarding | GLANCE",
  description: "Complete your initial administrator profile.",
};

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/portal/login");

  if (user.profileCompletedAt) {
    redirect("/portal/dashboard");
  }

  return (
    <FirstLoginOnboarding
      user={{
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        gender: user.gender,
        department: user.department,
        academicLevel: user.academicLevel,
      }}
    />
  );
}
