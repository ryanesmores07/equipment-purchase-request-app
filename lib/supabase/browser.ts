"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/supabase/env";

export function getSupabaseBrowserClient() {
  const { url, anonKey } = getSupabaseEnv();

  return createBrowserClient(url, anonKey);
}
