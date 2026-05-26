"use client";

import { useActionState } from "react";
import {
  cancelRequestAction,
  type RequestActionState,
} from "@/app/(app)/requests/_actions";
import { requestInputLimits } from "@/lib/request-limits";

const initialActionState: RequestActionState = {};

export function CancelRequestForm({ requestId }: { requestId: string }) {
  const [state, formAction, pending] = useActionState(
    cancelRequestAction,
    initialActionState,
  );

  return (
    <form
      action={formAction}
      className="grid gap-4 rounded-md border border-red-200 bg-red-50 p-4"
    >
      <input name="requestId" type="hidden" value={requestId} />
      <div>
        <h2 className="text-lg font-semibold text-red-900">
          申請をキャンセル
        </h2>
        <p className="mt-1 text-sm text-red-800">
          キャンセル後は申請内容を編集できません。記録は一覧と詳細に残ります。
        </p>
      </div>
      <div className="grid gap-2">
        <label
          className="text-sm font-medium text-red-900"
          htmlFor="cancellationNote"
        >
          キャンセル理由（任意）
        </label>
        <textarea
          className="min-h-24 w-full min-w-0 resize-y rounded-md border border-red-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-700"
          id="cancellationNote"
          name="cancellationNote"
          maxLength={requestInputLimits.cancellationNote}
        />
        <p className="text-xs text-red-800">
          {requestInputLimits.cancellationNote}文字以内で入力してください。
        </p>
        {state.fieldErrors?.cancellationNote ? (
          <p className="text-sm text-red-700">
            {state.fieldErrors.cancellationNote[0]}
          </p>
        ) : null}
      </div>
      <label className="flex items-start gap-2 text-sm text-red-900">
        <input
          className="mt-1"
          name="confirmCancel"
          required
          type="checkbox"
        />
        この申請をキャンセルし、以後編集できなくなることを確認しました。
      </label>
      {state.fieldErrors?.confirmCancel ? (
        <p className="text-sm text-red-700">
          キャンセル確認にチェックを入れてください。
        </p>
      ) : null}
      {state.formError ? (
        <p className="text-sm text-red-700" role="alert">
          {state.formError}
        </p>
      ) : null}
      <button
        className="w-full rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400 sm:w-fit"
        disabled={pending}
        type="submit"
      >
        {pending ? "キャンセル中..." : "申請をキャンセル"}
      </button>
    </form>
  );
}
