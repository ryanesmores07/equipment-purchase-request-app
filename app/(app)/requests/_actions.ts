"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canTransition } from "@/lib/domain/status";
import { requireAdmin } from "@/lib/auth/require-role";
import { requireUser } from "@/lib/auth/require-user";
import {
  createRequest,
  decideRequest,
  getRequestById,
} from "@/lib/repositories/requests.repo";
import {
  createRequestSchema,
  decideRequestSchema,
} from "@/lib/validation/request-schemas";

type ActionState = {
  fieldErrors?: Record<string, string[] | undefined>;
  formError?: string;
};

export type RequestActionState = ActionState;

export async function createRequestAction(
  _previousState: RequestActionState,
  formData: FormData,
): Promise<RequestActionState> {
  const parsed = createRequestSchema.safeParse({
    categoryId: formData.get("categoryId"),
    title: formData.get("title"),
    description: formData.get("description"),
    amountJpy: formData.get("amountJpy"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { supabase, user } = await requireUser();
  let requestId: string;

  try {
    const request = await createRequest(supabase, {
      ...parsed.data,
      applicantId: user.id,
    });
    requestId = request.id;
  } catch (error) {
    console.error({ op: "create-request-action", userId: user.id, error });
    return { formError: "申請を作成できませんでした。" };
  }

  revalidatePath("/requests");
  redirect(`/requests/${requestId}`);
}

export async function decideRequestAction(
  _previousState: RequestActionState,
  formData: FormData,
): Promise<RequestActionState> {
  const requestId = String(formData.get("requestId") ?? "");
  const parsed = decideRequestSchema.safeParse({
    status: formData.get("status"),
    decisionNote: formData.get("decisionNote"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { supabase, user } = await requireAdmin();
  const current = await getRequestById(supabase, requestId);

  if (!current) {
    return { formError: "申請が見つかりません。" };
  }

  if (!canTransition(current.status, parsed.data.status)) {
    return { formError: "この申請はすでに判断済みです。" };
  }

  try {
    await decideRequest(supabase, {
      id: requestId,
      status: parsed.data.status,
      decidedBy: user.id,
      decisionNote: parsed.data.decisionNote,
    });
  } catch (error) {
    console.error({ op: "decide-request-action", requestId, userId: user.id, error });
    return { formError: "申請の判断を更新できませんでした。" };
  }

  revalidatePath("/requests");
  revalidatePath(`/requests/${requestId}`);
  return {};
}
