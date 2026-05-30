// OpenFly Admin — outline icon set (stroke 1.5, round caps/joins).
// Ported from the design mockup (desktop-ui.jsx `Ic`/`Sunmark` + admin-kit.jsx
// `AIc`), kept identical to apps/web's icon system. Usage: <Ic.bell size={16} />
import type { CSSProperties, ReactNode } from "react";

export interface IconProps {
  size?: number;
  stroke?: string;
  sw?: number;
  fill?: string;
  style?: CSSProperties;
}

function I({
  size = 20,
  stroke = "currentColor",
  sw = 1.5,
  fill = "none",
  style,
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", flexShrink: 0, ...style }}
    >
      {children}
    </svg>
  );
}

// Brand mark (sunrise over horizon).
export function Sunmark({ size = 28, color }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      style={{ display: "block", color: color || "var(--rust)" }}
    >
      <g stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none">
        <line x1="6" y1="44" x2="54" y2="44" />
        <path d="M 12 44 A 18 18 0 0 1 48 44" />
        <line x1="30" y1="14" x2="30" y2="22" />
        <line x1="20" y1="18" x2="22.5" y2="25" />
        <line x1="40" y1="18" x2="37.5" y2="25" />
        <line x1="9" y1="29" x2="14" y2="32" />
        <line x1="51" y1="29" x2="46" y2="32" />
      </g>
    </svg>
  );
}

// Shared design icons (from desktop-ui.jsx).
export const Ic = {
  bell: (p: IconProps) => <I {...p}><path d="M6 8a6 6 0 1 1 12 0c0 4 1.5 5 2 6H4c.5-1 2-2 2-6z" /><path d="M10 18a2 2 0 0 0 4 0" /></I>,
  back: (p: IconProps) => <I {...p}><path d="M15 6l-6 6 6 6" /></I>,
  fwd: (p: IconProps) => <I {...p}><path d="M9 6l6 6-6 6" /></I>,
  down: (p: IconProps) => <I {...p}><path d="m6 9 6 6 6-6" /></I>,
  search: (p: IconProps) => <I {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></I>,
  user: (p: IconProps) => <I {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" /></I>,
  radar: (p: IconProps) => <I {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /></I>,
  ticket: (p: IconProps) => <I {...p}><path d="M3 9V7a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2a2 2 0 0 0 0 4v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2a2 2 0 0 0 0-4z" /><path d="M14 6v12" /></I>,
  check: (p: IconProps) => <I {...p}><path d="m5 12 5 5 9-11" /></I>,
  trend: (p: IconProps) => <I {...p}><path d="M3 17 9 11l4 4 8-9M14 6h7v7" /></I>,
  spark: (p: IconProps) => <I {...p}><path d="M12 2 13.6 8.4 20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6L12 2z" /></I>,
  gift: (p: IconProps) => <I {...p}><rect x="4" y="9" width="16" height="11" rx="1" /><path d="M2 9h20v3H2zM12 9v11M12 9S9 4 6.5 6 9 9 12 9zM12 9s3-5 5.5-3S15 9 12 9z" /></I>,
  clock: (p: IconProps) => <I {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></I>,
  close: (p: IconProps) => <I {...p}><path d="m6 6 12 12M18 6 6 18" /></I>,
  plus: (p: IconProps) => <I {...p}><path d="M12 5v14M5 12h14" /></I>,
  edit: (p: IconProps) => <I {...p}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></I>,
  download: (p: IconProps) => <I {...p}><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" /></I>,
  chevron: (p: IconProps) => <I {...p}><path d="m9 6 6 6-6 6" /></I>,
  info: (p: IconProps) => <I {...p}><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v5h1" /></I>,
  filter: (p: IconProps) => <I {...p}><path d="M4 6h16M7 12h10M10 18h4" /></I>,
  moon: (p: IconProps) => <I {...p}><path d="M20 14A8 8 0 1 1 10 4a7 7 0 0 0 10 10z" /></I>,
  sun: (p: IconProps) => <I {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5" /></I>,
  settings: (p: IconProps) => <I {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.1A1.6 1.6 0 0 0 6.6 19l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 12a2 2 0 0 1 0-4h.1A1.6 1.6 0 0 0 5 6.6l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 12 3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8 1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" /></I>,
  logout: (p: IconProps) => <I {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></I>,
};

// Admin-specific icons (from admin-kit.jsx `AIc`).
export const AIc = {
  grid: (p: IconProps) => <I {...p}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></I>,
  list: (p: IconProps) => <I {...p}><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></I>,
  users: (p: IconProps) => <I {...p}><circle cx="9" cy="8" r="3.5" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M16 5.5a3.5 3.5 0 0 1 0 7M21 20c0-2.6-1.6-4.8-4-5.6" /></I>,
  sliders: (p: IconProps) => <I {...p}><path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h12M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="8" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></I>,
  bank: (p: IconProps) => <I {...p}><path d="M3 9 12 4l9 5M5 9v8M19 9v8M9 9v8M15 9v8M3 21h18" /></I>,
  receipt: (p: IconProps) => <I {...p}><path d="M5 3v18l2-1.2L9 21l2-1.2L13 21l2-1.2L17 21l2-1.2V3l-2 1.2L15 3l-2 1.2L11 3 9 4.2 7 3 5 4.2z" /><path d="M8 9h8M8 13h5" /></I>,
  refresh: (p: IconProps) => <I {...p}><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" /></I>,
  history: (p: IconProps) => <I {...p}><path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" /><path d="M12 7v5l3 2" /></I>,
  cpu: (p: IconProps) => <I {...p}><rect x="7" y="7" width="10" height="10" rx="1.5" /><path d="M10 2v3M14 2v3M10 19v3M14 19v3M2 10h3M2 14h3M19 10h3M19 14h3" /></I>,
  copy: (p: IconProps) => <I {...p}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></I>,
  alert: (p: IconProps) => <I {...p}><path d="M12 9v4M12 17h.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></I>,
  external: (p: IconProps) => <I {...p}><path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" /></I>,
};
