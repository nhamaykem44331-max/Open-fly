"use client";

// Ops queue data (⭐ Hàng đợi xuất vé). Wraps GET /admin/bookings?status=PAID +
// the mark-ticketed / mark-issue-failed mutations. Server state via TanStack
// Query; mutations invalidate the list so a ticketed booking leaves the queue.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

interface ApiQueueItem {
  id: string;
  orderCode: string;
  status: string;
  pnr: string[];
  airline: string | null;
  route: string;
  departTime: string | null;
  muadiHoldExpiresAt: string | null;
  paymentDeadline: string | null;
  totalSellPrice: number;
  paidAt: string | null;
}

interface ApiQueueResponse {
  items: ApiQueueItem[];
  pagination: { page: number; limit: number; total: number };
}

export interface QueueRow {
  id: string;
  orderCode: string;
  pnrs: string[];
  airline: string | null;
  from: string;
  to: string;
  departLabel: string;
  paidLabel: string;
  amount: number; // full VND (Q-45)
  holdExpiresAt: number | null; // absolute ms for the countdown
  holdWindowMs: number | null; // paid→expiry span for the progress bar
}

// Booking datetimes are stored UTC `Z` → shift +7h for the displayed VN time
// (the countdown uses the absolute ms, no shift needed). Mirrors apps/web.
function vnLabel(iso: string | null): string {
  if (!iso) return "";
  const vn = new Date(new Date(iso).getTime() + 7 * 3600 * 1000);
  const hh = String(vn.getUTCHours()).padStart(2, "0");
  const mm = String(vn.getUTCMinutes()).padStart(2, "0");
  const DD = String(vn.getUTCDate()).padStart(2, "0");
  const MM = String(vn.getUTCMonth() + 1).padStart(2, "0");
  return `${hh}:${mm} ${DD}/${MM}`;
}

function adaptQueueRow(it: ApiQueueItem): QueueRow {
  const [from, to] = (it.route || "").split("-");
  const expiryIso = it.muadiHoldExpiresAt ?? it.paymentDeadline;
  const holdExpiresAt = expiryIso ? new Date(expiryIso).getTime() : null;
  const paidMs = it.paidAt ? new Date(it.paidAt).getTime() : null;
  return {
    id: it.id,
    orderCode: it.orderCode,
    pnrs: it.pnr ?? [],
    airline: it.airline,
    from: from ?? it.route ?? "",
    to: to ?? "",
    departLabel: vnLabel(it.departTime),
    paidLabel: vnLabel(it.paidAt),
    amount: it.totalSellPrice,
    holdExpiresAt,
    holdWindowMs: holdExpiresAt && paidMs ? holdExpiresAt - paidMs : null,
  };
}

const QUEUE_KEY = ["admin", "queue"];

export function useQueue() {
  return useQuery({
    queryKey: QUEUE_KEY,
    queryFn: async () => {
      const res = await apiFetch<ApiQueueResponse>("/admin/bookings?status=PAID&limit=50");
      return res.items.map(adaptQueueRow);
    },
    refetchInterval: 30_000, // ops queue stays fresh
  });
}

export interface TicketEntry {
  pnr: string;
  ticketNumber: string;
}

export function useMarkTicketed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; ticketNumbers: TicketEntry[]; notes?: string }) =>
      apiFetch(`/admin/bookings/${vars.id}/mark-ticketed`, {
        method: "POST",
        body: { ticketNumbers: vars.ticketNumbers, notes: vars.notes },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUEUE_KEY }),
  });
}

export function useMarkIssueFailed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; reason: string }) =>
      apiFetch(`/admin/bookings/${vars.id}/mark-issue-failed`, {
        method: "POST",
        body: { reason: vars.reason },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUEUE_KEY }),
  });
}
