"use client";

import { useActionState } from "react";
import {
  updateRequestAction,
  type RequestActionState,
} from "@/app/(app)/requests/_actions";
import { requestInputLimits } from "@/lib/request-limits";
import type {
  CategoryRow,
  PurchaseRequestRow,
} from "@/lib/repositories/types";

const initialActionState: RequestActionState = {};

export function EditRequestForm({
  categories,
  request,
}: {
  categories: CategoryRow[];
  request: PurchaseRequestRow;
}) {
  const [state, formAction, pending] = useActionState(
    updateRequestAction,
    initialActionState,
  );

  return (
    <form action={formAction} className="grid max-w-2xl min-w-0 gap-5">
      <input name="requestId" type="hidden" value={request.id} />
      <div className="grid gap-2">
        <label className="text-sm font-medium text-zinc-700" htmlFor="title">
          申請タイトル
        </label>
        <input
          className="w-full min-w-0 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          defaultValue={request.title}
          id="title"
          name="title"
          maxLength={requestInputLimits.title}
          required
        />
        <p className="text-xs text-zinc-500">
          {requestInputLimits.title}文字以内で入力してください。
        </p>
        {state.fieldErrors?.title ? (
          <p className="text-sm text-red-600">{state.fieldErrors.title[0]}</p>
        ) : null}
      </div>
      <div className="grid gap-2">
        <label
          className="text-sm font-medium text-zinc-700"
          htmlFor="categoryId"
        >
          カテゴリ
        </label>
        <select
          className="w-full min-w-0 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          defaultValue={request.category_id}
          id="categoryId"
          name="categoryId"
          required
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {state.fieldErrors?.categoryId ? (
          <p className="text-sm text-red-600">
            {state.fieldErrors.categoryId[0]}
          </p>
        ) : null}
      </div>
      <div className="grid gap-2">
        <label
          className="text-sm font-medium text-zinc-700"
          htmlFor="amountJpy"
        >
          金額（円）
        </label>
        <input
          className="w-full min-w-0 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          defaultValue={request.amount_jpy}
          id="amountJpy"
          name="amountJpy"
          type="number"
          min={1}
          max={requestInputLimits.amountJpy}
          inputMode="numeric"
          aria-describedby="amountJpy-help"
          required
        />
        <p className="text-xs text-zinc-500" id="amountJpy-help">
          半角数字で入力してください。例: 50000
        </p>
        {state.fieldErrors?.amountJpy ? (
          <p className="text-sm text-red-600">
            {state.fieldErrors.amountJpy[0]}
          </p>
        ) : null}
      </div>
      <div className="grid gap-2">
        <label
          className="text-sm font-medium text-zinc-700"
          htmlFor="description"
        >
          補足説明
        </label>
        <textarea
          className="min-h-32 w-full min-w-0 resize-y rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          defaultValue={request.description ?? ""}
          id="description"
          name="description"
          maxLength={requestInputLimits.description}
        />
        <p className="text-xs text-zinc-500">
          {requestInputLimits.description}文字以内で入力してください。
        </p>
        {state.fieldErrors?.description ? (
          <p className="text-sm text-red-600">
            {state.fieldErrors.description[0]}
          </p>
        ) : null}
      </div>
      {state.formError ? (
        <p className="text-sm text-red-600" role="alert">
          {state.formError}
        </p>
      ) : null}
      <button
        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400 sm:w-fit"
        disabled={pending}
        type="submit"
      >
        {pending ? "更新中..." : "申請を更新"}
      </button>
    </form>
  );
}
