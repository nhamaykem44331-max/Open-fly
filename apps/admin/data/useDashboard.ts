"use client";

// Dashboard (Tổng quan) stats — GET /admin/stats (read-only operational snapshot).
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export interface SoonExpiring {
  id: string;
  orderCode: string;
  route: string;
  airline: string | null;
  pnr: string[];
  departTime: string | null;
  holdExpiresAt: string | null;
}

export interface DashboardStats {
  pendingTickets: number;
  pendingTicketsUrgent: number;
  issueFailed: number;
  bookingsToday: number;
  revenueToday: number;
  huntsRunning: number;
  sessionHealthy: number;
  sessionTotal: number;
  paymentsReview: number;
  refundsOpen: number;
  soonExpiring: SoonExpiring[];
}

export function useDashboard() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => apiFetch<DashboardStats>("/admin/stats"),
    refetchInterval: 60_000,
  });
}
