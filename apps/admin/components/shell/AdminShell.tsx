"use client";

// Authenticated shell + client-side route guard. Bootstraps the session once;
// redirects to /login when unauthenticated; renders Sidebar + Topbar + content
// only when authed. (Tokens are client-held, so the gate is client-side — same
// model as apps/web.)
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useAuth } from "@/stores/auth";
import { T } from "@/lib/tokens";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const status = useAuth((s) => s.status);
  const bootstrap = useAuth((s) => s.bootstrap);

  useEffect(() => {
    if (status === "loading") bootstrap();
  }, [status, bootstrap]);

  useEffect(() => {
    if (status === "anon") router.replace("/login");
  }, [status, router]);

  if (status !== "authed") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.canvas, fontFamily: T.sans, fontSize: 13, color: T.ink3 }}>
        Đang tải…
      </div>
    );
  }

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
