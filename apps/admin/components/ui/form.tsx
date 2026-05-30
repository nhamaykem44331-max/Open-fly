"use client";

// Form primitives ported from the design mockup (admin-kit.jsx). Field = label +
// optional hint/error wrapper; Input = focus-aware text input.
import { useState, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { T } from "@/lib/tokens";

export function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 7 }}>
        <span style={{ fontFamily: T.sans, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.4, textTransform: "uppercase", color: error ? T.red : T.ink3 }}>
          {label}
          {required && <span style={{ color: T.rust }}> *</span>}
        </span>
        {hint && <span style={{ fontFamily: T.sans, fontSize: 11.5, color: T.ink4 }}>{hint}</span>}
      </div>
      {children}
      {error && <div style={{ fontFamily: T.sans, fontSize: 12, color: T.red, marginTop: 6 }}>{error}</div>}
    </label>
  );
}

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "style"> {
  mono?: boolean;
  error?: boolean;
}

export function Input({ mono, error, ...rest }: InputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...rest}
      onFocus={(e) => {
        setFocused(true);
        rest.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        rest.onBlur?.(e);
      }}
      style={{
        width: "100%",
        padding: "11px 13px",
        borderRadius: 7,
        outline: "none",
        border: `1px solid ${error ? T.red : focused ? T.ink : T.line2}`,
        background: focused ? T.paper : T.paper2,
        color: T.ink,
        fontFamily: mono ? T.mono : T.sans,
        fontSize: 14,
        letterSpacing: mono ? 0.5 : 0,
        transition: "border-color 0.15s, background 0.15s",
      }}
    />
  );
}

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "style"> {
  error?: boolean;
}

export function Textarea({ error, rows = 3, ...rest }: TextareaProps) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      {...rest}
      rows={rows}
      onFocus={(e) => {
        setFocused(true);
        rest.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        rest.onBlur?.(e);
      }}
      style={{
        width: "100%",
        padding: "11px 13px",
        borderRadius: 7,
        outline: "none",
        resize: "vertical",
        border: `1px solid ${error ? T.red : focused ? T.ink : T.line2}`,
        background: focused ? T.paper : T.paper2,
        color: T.ink,
        fontFamily: T.sans,
        fontSize: 14,
        lineHeight: 1.5,
        transition: "border-color 0.15s, background 0.15s",
      }}
    />
  );
}
