"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canTransition } from "@/lib/domain/status";
import { requireAdmin, requireEmployee } from "@/lib/auth/require-role";
import { requireUser } from "@/lib/auth/require-user";
import {
  cancelRequest,
  createRequest,
  decideRequest,
  getRequestById,
  updateRequest,
} from "@/lib/repositories/requests.repo";
import {
  cancelRequestSchema,
  createRequestSchema,
  decideRequestSchema,
  updateRequestSchema,
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

  const { supabase, user } = await requireEmployee();
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
  redirect(`/requests/${requestId}?result=created`);
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
  redirect(`/requests/${requestId}?result=${parsed.data.status}`);
}

export async function updateRequestAction(
  _previousState: RequestActionState,
  formData: FormData,
): Promise<RequestActionState> {
  const requestId = String(formData.get("requestId") ?? "");
  const parsed = updateRequestSchema.safeParse({
    categoryId: formData.get("categoryId"),
    title: formData.get("title"),
    description: formData.get("description"),
    amountJpy: formData.get("amountJpy"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { supabase, user } = await requireUser();
  const current = await getRequestById(supabase, requestId);

  if (!current || current.applicant_id !== user.id) {
    return { formError: "編集できる申請が見つかりません。" };
  }

  if (current.status !== "pending") {
    return { formError: "判断済みの申請は編集できません。" };
  }

  try {
    await updateRequest(supabase, {
      ...parsed.data,
      id: requestId,
      applicantId: user.id,
    });
  } catch (error) {
    console.error({ op: "update-request-action", requestId, userId: user.id, error });
    return { formError: "申請を更新できませんでした。" };
  }

  revalidatePath("/requests");
  revalidatePath(`/requests/${requestId}`);
  redirect(`/requests/${requestId}?result=updated`);
}

export async function cancelRequestAction(
  _previousState: RequestActionState,
  formData: FormData,
): Promise<RequestActionState> {
  const requestId = String(formData.get("requestId") ?? "");
  const parsed = cancelRequestSchema.safeParse({
    cancellationNote: formData.get("cancellationNote"),
    confirmCancel: formData.get("confirmCancel"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { supabase, user } = await requireUser();
  const current = await getRequestById(supabase, requestId);

  if (!current || current.applicant_id !== user.id) {
    return { formError: "キャンセルできる申請が見つかりません。" };
  }

  if (current.status !== "pending") {
    return { formError: "判断済みの申請はキャンセルできません。" };
  }

  try {
    await cancelRequest(supabase, {
      id: requestId,
      applicantId: user.id,
      ...parsed.data,
    });
  } catch (error) {
    console.error({ op: "cancel-request-action", requestId, userId: user.id, error });
    return { formError: "申請をキャンセルできませんでした。" };
  }

  revalidatePath("/requests");
  revalidatePath(`/requests/${requestId}`);
  redirect(`/requests/${requestId}?result=cancelled`);
}
