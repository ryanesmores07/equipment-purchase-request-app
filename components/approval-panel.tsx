"use client";

import { useActionState } from "react";
import {
  decideRequestAction,
  type RequestActionState,
} from "@/app/(app)/requests/_actions";
import { requestInputLimits } from "@/lib/request-limits";

const initialActionState: RequestActionState = {};

export function ApprovalPanel({ requestId }: { requestId: string }) {
  const [state, formAction, pending] = useActionState(
    decideRequestAction,
    initialActionState,
  );

  return (
    <form
      action={formAction}
      className="grid gap-4 rounded-md border border-zinc-200 bg-white p-4"
    >
      <input name="requestId" type="hidden" value={requestId} />
      <div>
        <h2 className="text-lg font-semibold text-zinc-950">管理者判断</h2>
        <p className="mt-1 text-sm text-zinc-600">
          承認する場合はメモなしで送信できます。却下する場合は理由を入力してください。
        </p>
      </div>
      <div className="grid gap-2">
        <label
          className="text-sm font-medium text-zinc-700"
          htmlFor="decisionNote"
        >
          判断メモ
        </label>
        <textarea
          className="min-h-24 w-full min-w-0 resize-y rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          id="decisionNote"
          name="decisionNote"
          maxLength={requestInputLimits.decisionNote}
        />
        <p className="text-xs text-zinc-500">
          {requestInputLimits.decisionNote}文字以内で入力してください。
        </p>
        {state.fieldErrors?.decisionNote ? (
          <p className="text-sm text-red-600">
            {state.fieldErrors.decisionNote[0]}
          </p>
        ) : null}
      </div>
      {state.formError ? (
        <p className="text-sm text-red-600" role="alert">
          {state.formError}
        </p>
      ) : null}
      <div className="grid gap-3 sm:flex sm:flex-wrap">
        <button
          className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
          disabled={pending}
          name="status"
          type="submit"
          value="approved"
        >
          {pending ? "送信中..." : "承認する"}
        </button>
        <button
          className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
          disabled={pending}
          name="status"
          type="submit"
          value="rejected"
        >
          {pending ? "送信中..." : "却下する"}
        </button>
      </div>
    </form>
  );
}
