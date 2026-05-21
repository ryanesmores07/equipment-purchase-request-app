import Link from "next/link";
import { logoutAction } from "@/app/(auth)/login/actions";
import { getProfileById } from "@/lib/repositories/profiles.repo";
import { requireUser } from "@/lib/auth/require-user";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { supabase, user } = await requireUser();
  const profile = await getProfileById(supabase, user.id);

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link className="font-semibold text-zinc-950" href="/requests">
            Equipment Requests
          </Link>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {profile ? (
              <span className="text-zinc-600">
                {profile.full_name} · {profile.role}
              </span>
            ) : null}
            <Link
              className="rounded-md border border-zinc-300 px-3 py-1.5 font-medium text-zinc-800"
              href="/requests/new"
            >
              New request
            </Link>
            <form action={logoutAction}>
              <button
                className="rounded-md bg-zinc-900 px-3 py-1.5 font-medium text-white"
                type="submit"
              >
                Logout
              </button>
            </form>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
