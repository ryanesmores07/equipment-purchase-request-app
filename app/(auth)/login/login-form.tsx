"use client";

import { useActionState } from "react";
import { loginAction, type LoginActionState } from "@/app/(auth)/login/actions";

const initialState: LoginActionState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-2">
        <label className="text-sm font-medium text-zinc-700" htmlFor="email">
          メールアドレス
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          required
        />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium text-zinc-700" htmlFor="password">
          パスワード
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          required
        />
      </div>
      {state.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        {pending ? "ログイン中..." : "ログイン"}
      </button>
    </form>
  );
}
