// OpenFly Admin — authenticated shell layout: Sidebar + Topbar + content.
// Route guard (redirect to /login when unauthenticated) is added in P1.2.
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Topbar />
        <main style={{ flex: 1 }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 40px 64px" }}>{children}</div>
        </main>
      </div>
    </div>
  );
}
