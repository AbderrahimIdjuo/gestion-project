import { requireAdminPage } from "@/lib/auth-utils";
import type { ReactElement, ReactNode } from "react";

/**
 * Server layout guard for admin-only page segments.
 * Sidebar filters are not sufficient — this runs on every request.
 */
export default async function AdminOnlyLayout({
  children,
}: {
  children: ReactNode;
}): Promise<ReactElement> {
  await requireAdminPage();
  return <>{children}</>;
}
