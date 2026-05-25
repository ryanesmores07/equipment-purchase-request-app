import Link from "next/link";
import { notFound } from "next/navigation";
import { ApprovalPanel } from "@/components/approval-panel";
import { RequestStatusBadge } from "@/components/request-status-badge";
import { requireUser } from "@/lib/auth/require-user";
import { listCategories } from "@/lib/repositories/categories.repo";
import { listApprovalHistory } from "@/lib/repositories/history.repo";
import {
  getProfileById,
  listProfilesByIds,
} from "@/lib/repositories/profiles.repo";
import { getRequestById } from "@/lib/repositories/requests.repo";
import { formatDate, formatDateTime, statusLabels } from "@/lib/ui-labels";

const yenFormatter = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const [request, categories, profile] = await Promise.all([
    getRequestById(supabase, id),
    listCategories(supabase),
    getProfileById(supabase, user.id),
  ]);

  if (!request) {
    notFound();
  }

  const history = await listApprovalHistory(supabase, request.id);
  const category = categories.find((item) => item.id === request.category_id);
  const relatedProfileIds = [request.applicant_id, request.decided_by].filter(
    (value): value is string => Boolean(value),
  );
  const relatedProfiles = await listProfilesByIds(supabase, relatedProfileIds);
  const profileNames = Object.fromEntries(
    relatedProfiles.map((item) => [item.id, item.full_name]),
  );
  const isApplicant = request.applicant_id === user.id;
  const isPending = request.status === "pending";
  const canApplicantChange = isApplicant && isPending;
  const isLocked = !isPending;

  return (
    <section className="grid gap-6">
      <div>
        <Link
          className="text-sm font-medium text-zinc-700 underline-offset-4 hover:underline"
          href="/requests"
        >
          申請一覧に戻る
        </Link>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-950">
            {request.title}
          </h1>
          <p className="text-sm text-zinc-600">
            申請日: {formatDate(request.requested_at)}
          </p>
        </div>
        <RequestStatusBadge status={request.status} />
      </div>
      <dl className="grid gap-4 rounded-md border border-zinc-200 bg-white p-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase text-zinc-500">
            申請者
          </dt>
          <dd className="mt-1 text-sm text-zinc-950">
            {profileNames[request.applicant_id] ?? "不明"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-zinc-500">
            カテゴリ
          </dt>
          <dd className="mt-1 text-sm text-zinc-950">
            {category?.name ?? "不明"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-zinc-500">
            金額
          </dt>
          <dd className="mt-1 text-sm text-zinc-950">
            {yenFormatter.format(request.amount_jpy)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-zinc-500">
            判断日
          </dt>
          <dd className="mt-1 text-sm text-zinc-950">
            {formatDate(request.decided_at)}
          </dd>
        </div>
        {request.decided_by ? (
          <div>
            <dt className="text-xs font-medium uppercase text-zinc-500">
              判断者
            </dt>
            <dd className="mt-1 text-sm text-zinc-950">
              {profileNames[request.decided_by] ?? "不明"}
            </dd>
          </div>
        ) : null}
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase text-zinc-500">
            補足説明
          </dt>
          <dd className="mt-1 whitespace-pre-wrap text-sm text-zinc-950">
            {request.description || "補足説明はありません。"}
          </dd>
        </div>
        {request.decision_note ? (
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase text-zinc-500">
              判断メモ
            </dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm text-zinc-950">
              {request.decision_note}
            </dd>
          </div>
        ) : null}
      </dl>
      {canApplicantChange ? (
        <section className="rounded-md border border-zinc-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-zinc-950">申請者操作</h2>
          <p className="mt-1 text-sm text-zinc-600">
            未判断の申請は、管理者が判断する前に編集またはキャンセルできます。
          </p>
        </section>
      ) : null}
      {isLocked ? (
        <section className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
          <h2 className="text-lg font-semibold text-zinc-950">
            この申請はロックされています
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            判断済みの申請は、内容の変更やキャンセルができません。
          </p>
        </section>
      ) : null}
      {profile?.role === "admin" && request.status === "pending" ? (
        <ApprovalPanel requestId={request.id} />
      ) : null}
      <section className="grid gap-3">
        <h2 className="text-lg font-semibold text-zinc-950">
          承認履歴
        </h2>
        {history.length === 0 ? (
          <p className="rounded-md border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
            まだ承認履歴はありません。
          </p>
        ) : (
          <ol className="grid gap-2">
            {history.map((item) => (
              <li
                className="rounded-md border border-zinc-200 bg-white p-4 text-sm"
                key={item.id}
              >
                <span className="font-medium text-zinc-950">
                  {statusLabels[item.from_status]}から
                  {statusLabels[item.to_status]}へ変更
                </span>
                <span className="ml-2 text-zinc-500">
                  {formatDateTime(item.acted_at)}
                </span>
                {item.note ? (
                  <p className="mt-2 whitespace-pre-wrap text-zinc-700">
                    {item.note}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>
    </section>
  );
}
