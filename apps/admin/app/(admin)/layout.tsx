// OpenFly Admin — authenticated section. AdminShell handles the route guard
// (redirect to /login when unauthenticated) and renders Sidebar + Topbar.
import { AdminShell } from "@/components/shell/AdminShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
