import type { getSupabaseServerClient } from "@/lib/supabase/server";

export type SupabaseServerClient = Awaited<
  ReturnType<typeof getSupabaseServerClient>
>;

export type ProfileRow = {
  id: string;
  email: string;
  full_name: string;
  role: "employee" | "admin";
  created_at: string;
};

export type CategoryRow = {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
};

export type PurchaseRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled";

export type PurchaseRequestRow = {
  id: string;
  applicant_id: string;
  category_id: string;
  title: string;
  description: string | null;
  amount_jpy: number;
  status: PurchaseRequestStatus;
  requested_at: string;
  decided_at: string | null;
  decided_by: string | null;
  decision_note: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancellation_note: string | null;
};

export type ApprovalHistoryRow = {
  id: string;
  request_id: string;
  actor_id: string;
  from_status: PurchaseRequestStatus;
  to_status: PurchaseRequestStatus;
  note: string | null;
  acted_at: string;
};

export type RequestActivityAction =
  | "created"
  | "edited"
  | "cancelled"
  | "approved"
  | "rejected";

export type RequestActivityChangeField =
  | "category_id"
  | "title"
  | "description"
  | "amount_jpy";

export type RequestActivityChangeValue = {
  from: string | number | null;
  to: string | number | null;
};

export type RequestActivityChanges = Partial<
  Record<RequestActivityChangeField, RequestActivityChangeValue>
>;

export type RequestActivityRow = {
  id: string;
  request_id: string;
  actor_id: string;
  action: RequestActivityAction;
  note: string | null;
  changes: RequestActivityChanges | null;
  acted_at: string;
};
