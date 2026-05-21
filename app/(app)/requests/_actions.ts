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

const initialActionState: RequestActionState = {};

export { initialActionState };

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
    return { formError: "Could not create the request." };
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
    return { formError: "Request not found." };
  }

  if (!canTransition(current.status, parsed.data.status)) {
    return { formError: "This status transition is not allowed." };
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
    return { formError: "Could not update the request decision." };
  }

  revalidatePath("/requests");
  revalidatePath(`/requests/${requestId}`);
  return {};
}
