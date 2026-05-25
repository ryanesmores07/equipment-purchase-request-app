"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type LoginActionState = {
  error?: string;
};

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "メールアドレスとパスワードを入力してください。" };
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error({ op: "login", email, error });
    return { error: "メールアドレスまたはパスワードが正しくありません。" };
  }

  redirect("/requests");
}

export async function logoutAction() {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error({ op: "logout", error });
  }

  redirect("/login");
}
