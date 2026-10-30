import type { Metadata } from "next";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Portal",
  description:
    "The GLANCE portal: where chapters, coordinators, communications and the GLANCE team run their work.",
};

/**
 * Every portal route reads the session cookie and live database records, so
 * none of them may be prerendered or cached into a static shell. Waiting on
 * the incoming request here guarantees unauthenticated visits receive a real
 * HTTP redirect instead of a streamed shell.
 */
export const instant = false;

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  return <>{children}</>;
}
