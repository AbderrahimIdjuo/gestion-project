import AdminOnlyLayout from "@/components/admin-only-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminOnlyLayout>{children}</AdminOnlyLayout>;
}
