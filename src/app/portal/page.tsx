import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";

/**
 * The portal has no public landing page. /portal is the single, unadvertised
 * entry point: it sends a signed-out visitor to the login screen and an
 * authenticated one straight to the right home for their role.
 */
export default async function PortalIndexPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/portal/login");
  if (user.role === "MEMBER" || user.role === "ALUMNI") redirect("/portal/profile");
  redirect("/portal/dashboard");
}
