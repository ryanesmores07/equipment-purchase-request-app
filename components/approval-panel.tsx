"use client";

import { useActionState } from "react";
import {
  decideRequestAction,
  type RequestActionState,
} from "@/app/(app)/requests/_actions";

const initialActionState: RequestActionState = {};

export function ApprovalPanel({ requestId }: { requestId: string }) {
  const [state, formAction, pending] = useActionState(
    decideRequestAction,
    initialActionState,
  );

  return (
    <form action={formAction} className="grid gap-4 rounded-md border border-zinc-200 bg-white p-4">
      <input name="requestId" type="hidden" value={requestId} />
      <div className="grid gap-2">
        <label
          className="text-sm font-medium text-zinc-700"
          htmlFor="decisionNote"
        >
          Decision note
        </label>
        <textarea
          className="min-h-24 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          id="decisionNote"
          name="decisionNote"
          maxLength={500}
        />
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
      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
          disabled={pending}
          name="status"
          type="submit"
          value="approved"
        >
          Approve
        </button>
        <button
          className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
          disabled={pending}
          name="status"
          type="submit"
          value="rejected"
        >
          Reject
        </button>
      </div>
    </form>
  );
}
