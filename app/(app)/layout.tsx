import Link from "next/link";
import { logoutAction } from "@/app/(auth)/login/actions";
import { requireUser } from "@/lib/auth/require-user";
import { getProfileById } from "@/lib/repositories/profiles.repo";
import { roleLabels } from "@/lib/ui-labels";

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
        <nav className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            className="text-base font-semibold text-zinc-950 sm:text-sm"
            href="/requests"
          >
            備品購入申請
          </Link>
          <div className="flex w-full items-center justify-between gap-3 text-sm sm:w-auto sm:justify-end">
            {profile ? (
              <span className="min-w-0 text-zinc-600">
                <span className="block truncate font-medium text-zinc-800 sm:inline">
                  {profile.full_name}
                </span>
                <span className="block text-xs sm:ml-1 sm:inline sm:text-sm">
                  / {roleLabels[profile.role]}
                </span>
              </span>
            ) : null}
            <form action={logoutAction} className="shrink-0">
              <button
                className="rounded-md bg-zinc-900 px-3 py-1.5 font-medium text-white"
                type="submit"
              >
                ログアウト
              </button>
            </form>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
