import type {
  CreateRequestInput,
  CancelRequestInput,
  UpdateRequestInput,
} from "@/lib/validation/request-schemas";
import type {
  PurchaseRequestRow,
  PurchaseRequestStatus,
  SupabaseServerClient,
} from "@/lib/repositories/types";

type CreateRequestParams = CreateRequestInput & {
  applicantId: string;
};

type DecideRequestParams = {
  id: string;
  status: "approved" | "rejected";
  decidedBy: string;
  decisionNote?: string;
};

type CancelRequestParams = CancelRequestInput & {
  id: string;
  applicantId: string;
};

type UpdateRequestParams = UpdateRequestInput & {
  id: string;
  applicantId: string;
};

type ListRequestsParams = {
  status?: PurchaseRequestStatus;
};

const requestSelect =
  "id,applicant_id,category_id,title,description,amount_jpy,status,requested_at,decided_at,decided_by,decision_note,cancelled_at,cancelled_by,cancellation_note";

export async function listRequests(
  supabase: SupabaseServerClient,
  params: ListRequestsParams = {},
): Promise<PurchaseRequestRow[]> {
  let query = supabase
    .from("purchase_requests")
    .select(requestSelect)
    .order("requested_at", { ascending: false });

  if (params.status) {
    query = query.eq("status", params.status);
  }

  const { data, error } = await query.limit(100);

  if (error) {
    console.error({ op: "list-requests", error });
    throw new Error("Failed to load purchase requests.");
  }

  return data ?? [];
}

export async function getRequestById(
  supabase: SupabaseServerClient,
  id: string,
): Promise<PurchaseRequestRow | null> {
  const { data, error } = await supabase
    .from("purchase_requests")
    .select(requestSelect)
    .eq("id", id)
    .maybeSingle<PurchaseRequestRow>();

  if (error) {
    console.error({ op: "get-request-by-id", id, error });
    throw new Error("Failed to load purchase request.");
  }

  return data;
}

export async function createRequest(
  supabase: SupabaseServerClient,
  params: CreateRequestParams,
): Promise<PurchaseRequestRow> {
  const { data, error } = await supabase
    .from("purchase_requests")
    .insert({
      applicant_id: params.applicantId,
      category_id: params.categoryId,
      title: params.title,
      description: params.description ?? null,
      amount_jpy: params.amountJpy,
    })
    .select(requestSelect)
    .single<PurchaseRequestRow>();

  if (error) {
    console.error({ op: "create-request", applicantId: params.applicantId, error });
    throw new Error("Failed to create purchase request.");
  }

  return data;
}

export async function updateRequest(
  supabase: SupabaseServerClient,
  params: UpdateRequestParams,
): Promise<PurchaseRequestRow> {
  const { data, error } = await supabase
    .from("purchase_requests")
    .update({
      category_id: params.categoryId,
      title: params.title,
      description: params.description ?? null,
      amount_jpy: params.amountJpy,
    })
    .eq("id", params.id)
    .eq("applicant_id", params.applicantId)
    .eq("status", "pending")
    .select(requestSelect)
    .single<PurchaseRequestRow>();

  if (error) {
    console.error({
      op: "update-request",
      requestId: params.id,
      applicantId: params.applicantId,
      error,
    });
    throw new Error("Failed to update purchase request.");
  }

  return data;
}

export async function cancelRequest(
  supabase: SupabaseServerClient,
  params: CancelRequestParams,
): Promise<PurchaseRequestRow> {
  const { data, error } = await supabase
    .from("purchase_requests")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancelled_by: params.applicantId,
      cancellation_note: params.cancellationNote ?? null,
    })
    .eq("id", params.id)
    .eq("applicant_id", params.applicantId)
    .eq("status", "pending")
    .select(requestSelect)
    .single<PurchaseRequestRow>();

  if (error) {
    console.error({
      op: "cancel-request",
      requestId: params.id,
      applicantId: params.applicantId,
      error,
    });
    throw new Error("Failed to cancel purchase request.");
  }

  return data;
}

export async function decideRequest(
  supabase: SupabaseServerClient,
  params: DecideRequestParams,
): Promise<PurchaseRequestRow> {
  const { data, error } = await supabase
    .from("purchase_requests")
    .update({
      status: params.status,
      decided_at: new Date().toISOString(),
      decided_by: params.decidedBy,
      decision_note: params.decisionNote ?? null,
    })
    .eq("id", params.id)
    .select(requestSelect)
    .single<PurchaseRequestRow>();

  if (error) {
    console.error({ op: "decide-request", requestId: params.id, error });
    throw new Error("Failed to update purchase request decision.");
  }

  return data;
}
