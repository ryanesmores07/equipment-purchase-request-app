import type {
  ApprovalHistoryRow,
  RequestActivityRow,
  SupabaseServerClient,
} from "@/lib/repositories/types";

export async function listApprovalHistory(
  supabase: SupabaseServerClient,
  requestId: string,
): Promise<ApprovalHistoryRow[]> {
  const { data, error } = await supabase
    .from("approval_history")
    .select("id,request_id,actor_id,from_status,to_status,note,acted_at")
    .eq("request_id", requestId)
    .order("acted_at", { ascending: false });

  if (error) {
    console.error({ op: "list-approval-history", requestId, error });
    throw new Error("Failed to load approval history.");
  }

  return data ?? [];
}

export async function listRequestActivity(
  supabase: SupabaseServerClient,
  requestId: string,
): Promise<RequestActivityRow[]> {
  const { data, error } = await supabase
    .from("request_activity")
    .select("id,request_id,actor_id,action,note,acted_at")
    .eq("request_id", requestId)
    .order("acted_at", { ascending: false });

  if (error) {
    console.error({ op: "list-request-activity", requestId, error });
    throw new Error("Failed to load request activity.");
  }

  return data ?? [];
}
