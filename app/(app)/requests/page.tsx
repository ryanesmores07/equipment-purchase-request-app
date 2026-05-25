import Link from "next/link";
import { RequestList } from "@/components/request-list";
import { requestStatuses } from "@/lib/domain/status";
import { requireUser } from "@/lib/auth/require-user";
import { listCategories } from "@/lib/repositories/categories.repo";
import {
  getProfileById,
  listProfilesByIds,
} from "@/lib/repositories/profiles.repo";
import { listRequests } from "@/lib/repositories/requests.repo";
import type { PurchaseRequestStatus } from "@/lib/repositories/types";

function toValidStatus(value: string | string[] | undefined) {
  const status = Array.isArray(value) ? value[0] : value;
  return requestStatuses.includes(status as PurchaseRequestStatus)
    ? (status as PurchaseRequestStatus)
    : undefined;
}

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const { supabase, user } = await requireUser();
  const params = await searchParams;
  const profile = await getProfileById(supabase, user.id);
  const isAdmin = profile?.role === "admin";
  const activeStatus = isAdmin ? toValidStatus(params.status) : undefined;

  const [requests, categories] = await Promise.all([
    listRequests(supabase, { status: activeStatus }),
    listCategories(supabase),
  ]);
  const applicants = isAdmin
    ? await listProfilesByIds(
        supabase,
        requests.map((request) => request.applicant_id),
      )
    : [];
  const applicantNames = Object.fromEntries(
    applicants.map((applicant) => [applicant.id, applicant.full_name]),
  );

  return (
    <section className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-950">
            申請一覧
          </h1>
          <p className="text-sm text-zinc-600">
            {isAdmin
              ? "全社員の申請を確認し、状態で絞り込めます。"
              : "自分が作成した購入申請を確認できます。"}
          </p>
        </div>
        {!isAdmin ? (
          <Link
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
            href="/requests/new"
          >
            新規申請
          </Link>
        ) : null}
      </div>
      <RequestList
        activeStatus={activeStatus}
        applicantNames={applicantNames}
        categories={categories}
        isAdmin={isAdmin}
        requests={requests}
      />
    </section>
  );
}
