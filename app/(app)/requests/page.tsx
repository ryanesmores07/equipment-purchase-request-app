import Link from "next/link";
import { RequestList } from "@/components/request-list";
import { requireUser } from "@/lib/auth/require-user";
import { listCategories } from "@/lib/repositories/categories.repo";
import { listRequests } from "@/lib/repositories/requests.repo";

export default async function RequestsPage() {
  const { supabase } = await requireUser();
  const [requests, categories] = await Promise.all([
    listRequests(supabase),
    listCategories(supabase),
  ]);

  return (
    <section className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-950">
            Purchase requests
          </h1>
          <p className="text-sm text-zinc-600">
            Employees see their own requests. Admins see all requests.
          </p>
        </div>
        <Link
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          href="/requests/new"
        >
          New request
        </Link>
      </div>
      <RequestList categories={categories} requests={requests} />
    </section>
  );
}
