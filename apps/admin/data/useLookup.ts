"use client";

// Booking lookup — search (GET /admin/bookings/search) + full detail
// (GET /admin/bookings/:id).
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export interface LookupRow {
  id: string;
  orderCode: string;
  status: string;
  pnr: string[];
  airline: string | null;
  flightNumber: string | null;
  route: string;
  departTime: string | null;
  total: number;
  userName: string | null;
  userPhone: string | null;
}

export interface BookingDetail {
  id: string;
  orderCode: string;
  status: string;
  airline: string | null;
  flightNumber: string | null;
  aircraft: string | null;
  cabin: string;
  from: string;
  to: string;
  departTime: string | null;
  arriveTime: string | null;
  duration: string | null;
  user: { id: string; fullName: string | null; phone: string | null; email: string | null } | null;
  contact: { phone: string; email: string };
  pnrs: { airline: string | null; pnr: string; ticketNumber: string | null }[];
  passengers: { fullName: string; gender: string | null; dob: string | null; isChild: boolean }[];
  timeline: { eventType: string; title: string; occurredAt: string }[];
  payments: { provider: string; amount: number; status: string; paidAt: string | null; transactionRef: string | null }[];
  price: { net: number; markup: number; tax: number; fee: number; addons: number; voucherDiscount: number; voucherCode: string | null; total: number };
  vat: { status: string; invoiceNumber: string | null };
  holdExpiresAt: string | null;
  paymentDeadline: string | null;
  createdAt: string;
}

interface LookupResponse {
  items: LookupRow[];
  pagination: { page: number; limit: number; total: number };
}

export function useLookupSearch(q: string, status: string) {
  return useQuery({
    queryKey: ["admin", "lookup", q, status],
    queryFn: () => {
      const p = new URLSearchParams();
      if (q.trim()) p.set("q", q.trim());
      if (status) p.set("status", status);
      p.set("limit", "50");
      return apiFetch<LookupResponse>(`/admin/bookings/search?${p.toString()}`);
    },
  });
}

export function useBookingDetail(id: string | null) {
  return useQuery({
    queryKey: ["admin", "booking", id],
    queryFn: () => apiFetch<BookingDetail>(`/admin/bookings/${id}`),
    enabled: !!id,
  });
}
