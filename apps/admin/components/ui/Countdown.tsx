"use client";

// Live countdown to a hold-expiry timestamp (ms). Color shifts green → amber
// (<30m) → red (<10m / expired). Ported from admin-kit.jsx.
import { useEffect, useState } from "react";
import { T } from "@/lib/tokens";

export function Countdown({ expiry, size = 14 }: { expiry: number; size?: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const ms = expiry - now;
  const expired = ms <= 0;
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const urgent = ms < 10 * 60 * 1000;
  const warn = ms < 30 * 60 * 1000;
  const col = expired || urgent ? T.red : warn ? T.amber : T.ink2;
  const label = expired
    ? "Hết hạn"
    : h > 0
      ? `${h}g ${String(m).padStart(2, "0")}p`
      : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: col,
          flexShrink: 0,
          animation: urgent && !expired ? "pulseDot 1.1s ease-in-out infinite" : "none",
        }}
      />
      <span suppressHydrationWarning style={{ fontFamily: T.mono, fontSize: size, fontWeight: 500, color: col, fontVariantNumeric: "tabular-nums", letterSpacing: 0.2 }}>
        {label}
      </span>
    </span>
  );
}
