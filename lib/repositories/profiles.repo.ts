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
