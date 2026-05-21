import type {
  CategoryRow,
  SupabaseServerClient,
} from "@/lib/repositories/types";

export async function listCategories(
  supabase: SupabaseServerClient,
): Promise<CategoryRow[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,sort_order,created_at")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error({ op: "list-categories", error });
    throw new Error("Failed to load categories.");
  }

  return data ?? [];
}
