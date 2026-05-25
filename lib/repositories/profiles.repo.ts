import type {
  ProfileRow,
  SupabaseServerClient,
} from "@/lib/repositories/types";

export async function getProfileById(
  supabase: SupabaseServerClient,
  id: string,
): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,created_at")
    .eq("id", id)
    .maybeSingle<ProfileRow>();

  if (error) {
    console.error({ op: "get-profile-by-id", id, error });
    throw new Error("Failed to load profile.");
  }

  return data;
}

export async function listProfilesByIds(
  supabase: SupabaseServerClient,
  ids: string[],
): Promise<ProfileRow[]> {
  const uniqueIds = Array.from(new Set(ids));

  if (uniqueIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,created_at")
    .in("id", uniqueIds);

  if (error) {
    console.error({ op: "list-profiles-by-ids", count: uniqueIds.length, error });
    throw new Error("Failed to load applicant profiles.");
  }

  return data ?? [];
}
