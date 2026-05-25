"use client";

import { useActionState } from "react";
import {
  createRequestAction,
  type RequestActionState,
} from "@/app/(app)/requests/_actions";
import type { CategoryRow } from "@/lib/repositories/types";

const initialActionState: RequestActionState = {};

export function CreateRequestForm({
  categories,
}: {
  categories: CategoryRow[];
}) {
  const [state, formAction, pending] = useActionState(
    createRequestAction,
    initialActionState,
  );

  return (
    <form action={formAction} className="grid max-w-2xl gap-5">
      <div className="grid gap-2">
        <label className="text-sm font-medium text-zinc-700" htmlFor="title">
          申請タイトル
        </label>
        <input
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          id="title"
          name="title"
          maxLength={120}
          required
        />
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
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          id="categoryId"
          name="categoryId"
          required
        >
          <option value="">カテゴリを選択</option>
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
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          id="amountJpy"
          name="amountJpy"
          type="number"
          min={1}
          max={10000000}
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
          className="min-h-32 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          id="description"
          name="description"
          maxLength={1000}
        />
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
        className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
        disabled={pending}
        type="submit"
      >
        {pending ? "作成中..." : "申請を作成"}
      </button>
    </form>
  );
}
