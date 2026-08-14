import { redirect } from "next/navigation";

/** Leftover route: the real dashboard with Navbar/Sidebar lives at `/`. */
export default function DashboardPage() {
  redirect("/");
}
