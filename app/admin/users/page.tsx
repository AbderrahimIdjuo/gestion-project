import { getAllUsersWithRoles } from "@/lib/auth-utils";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AdminUsersClient from "./admin-users-client";

export default async function AdminUsersPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const userRole = user?.publicMetadata?.role as string;

  if (userRole !== "admin") {
    redirect("/dashboard");
  }

  const users = await getAllUsersWithRoles();

  return <AdminUsersClient users={users} />;
}
