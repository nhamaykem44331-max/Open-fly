// Toast notifications (Zustand). `toast(msg, tone)` from anywhere; ToastHost
// renders them. Ported from the mockup's event-driven toast (admin-kit.jsx).
import { create } from "zustand";

export type ToastTone = "neutral" | "green" | "amber" | "red" | "rust";
export interface ToastItem {
  id: number;
  msg: string;
  tone: ToastTone;
}

interface ToastState {
  items: ToastItem[];
  push: (msg: string, tone?: ToastTone) => void;
  remove: (id: number) => void;
}

let seq = 0;

export const useToastStore = create<ToastState>((set) => ({
  items: [],
  push: (msg, tone = "neutral") => {
    const id = ++seq;
    set((s) => ({ items: [...s.items, { id, msg, tone }] }));
    setTimeout(() => set((s) => ({ items: s.items.filter((x) => x.id !== id) })), 3200);
  },
  remove: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
}));

export function toast(msg: string, tone: ToastTone = "neutral") {
  useToastStore.getState().push(msg, tone);
}
