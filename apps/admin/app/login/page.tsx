"use client";

// Admin login — email/password (Q-60b). 2FA TOTP deferred (a later security
// milestone will add the OTP step the mockup sketches). Full-screen two-panel.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { T } from "@/lib/tokens";
import { Ic, Sunmark } from "@/components/icons";
import { Field, Input } from "@/components/ui/form";
import { useAuth } from "@/stores/auth";
import { ApiError } from "@/lib/api/client";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuth((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [shake, setShake] = useState(false);

  const fail = (msg: string) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!email.trim() || !password) {
      fail("Vui lòng nhập email và mật khẩu.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace("/dashboard");
    } catch (err) {
      fail(err instanceof ApiError ? err.message : "Không kết nối được máy chủ. Thử lại sau.");
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: T.canvas }}>
      {/* Left brand panel */}
      <div
        style={{
          flex: "1 1 46%",
          background: T.inkBlock,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "52px 56px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 11, position: "relative", zIndex: 1 }}>
          <Sunmark size={30} color={T.rustSoft} />
          <span style={{ fontFamily: T.serif, fontSize: 23, letterSpacing: "-1px", color: T.onInk, fontWeight: 300 }}>
            Open<span style={{ color: T.rustSoft, fontWeight: 600 }}>Fly</span>
          </span>
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 600, letterSpacing: 2.5, textTransform: "uppercase", color: T.rustSoft, marginBottom: 20 }}>
            Bảng quản trị nội bộ
          </div>
          <h1 style={{ fontFamily: T.serif, fontSize: 40, fontWeight: 400, letterSpacing: "-1.4px", color: T.onInk, margin: 0, lineHeight: 1.12, maxWidth: 420 }}>
            Công cụ vận hành
            <br />
            cho đội ngũ OpenFly.
          </h1>
          <p style={{ fontFamily: T.sans, fontSize: 14, color: "rgba(245,241,234,0.6)", lineHeight: 1.6, marginTop: 18, maxWidth: 380 }}>
            Xuất vé, tra cứu booking, quản lý giá và giám sát hệ thống — bình tĩnh, chuyên nghiệp, đáng tin như chính sản phẩm.
          </p>
        </div>
        <div style={{ fontFamily: T.mono, fontSize: 11.5, color: "rgba(245,241,234,0.4)", position: "relative", zIndex: 1 }}>
          openfly.vn/admin · v1.0
        </div>
        {/* faint sun rings */}
        <div style={{ position: "absolute", right: -120, bottom: -120, width: 360, height: 360, borderRadius: "50%", border: "1px solid rgba(232,153,119,0.16)", zIndex: 0 }} />
        <div style={{ position: "absolute", right: -60, bottom: -60, width: 240, height: 240, borderRadius: "50%", border: "1px solid rgba(232,153,119,0.12)", zIndex: 0 }} />
      </div>

      {/* Right form panel */}
      <div style={{ flex: "1 1 54%", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <form onSubmit={submit} style={{ width: "100%", maxWidth: 380, animation: shake ? "shakeX 0.4s" : "none" }}>
          <div style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 600, letterSpacing: 2.5, textTransform: "uppercase", color: T.ink3, marginBottom: 14 }}>
            <span style={{ color: T.rust, marginRight: 8 }}>—</span>Đăng nhập
          </div>
          <h2 style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 500, letterSpacing: "-1px", color: T.ink, margin: "0 0 8px" }}>
            Chào mừng trở lại
          </h2>
          <p style={{ fontFamily: T.sans, fontSize: 13.5, color: T.ink3, margin: "0 0 30px" }}>
            Đăng nhập bằng tài khoản quản trị OpenFly.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Field label="Email công ty" required>
              <Input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ten@openfly.vn"
              />
            </Field>
            <Field label="Mật khẩu" required>
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>
          </div>

          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, fontFamily: T.sans, fontSize: 13, color: T.red }}>
              <Ic.info size={15} stroke="currentColor" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%",
              marginTop: 26,
              padding: 15,
              borderRadius: 8,
              border: "1px solid transparent",
              cursor: submitting ? "default" : "pointer",
              background: T.rust,
              color: "#F5F1EA",
              fontFamily: T.serif,
              fontSize: 15.5,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 9,
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? "Đang đăng nhập…" : "Đăng nhập"}
            {!submitting && <Ic.arrow size={17} stroke="currentColor" />}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 22, justifyContent: "center" }}>
            <Ic.shield size={13} stroke={T.ink4} />
            <span style={{ fontFamily: T.sans, fontSize: 12, color: T.ink4 }}>Xác thực 2 lớp (2FA) sẽ bật ở giai đoạn bảo mật</span>
          </div>
        </form>
      </div>
    </div>
  );
}
