import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";

export type AppRole = "employee" | "admin";

type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: AppRole;
};

export async function requireRole(role: AppRole) {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,full_name,role")
    .eq("id", user.id)
    .single<Profile>();

  if (error || !data) {
    console.error({
      op: "require-role-profile",
      userId: user.id,
      error,
    });
    redirect("/login");
  }

  if (data.role !== role) {
    redirect("/requests");
  }

  return { supabase, user, profile: data };
}

export async function requireAdmin() {
  return requireRole("admin");
}

export async function requireEmployee() {
  return requireRole("employee");
}
