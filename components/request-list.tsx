import Link from "next/link";
import { RequestStatusBadge } from "@/components/request-status-badge";
import { StatusFilterNav } from "@/components/status-filter-nav";
import type {
  CategoryRow,
  PurchaseRequestRow,
  PurchaseRequestStatus,
} from "@/lib/repositories/types";
import { formatDate, statusFilterLabels } from "@/lib/ui-labels";

const yenFormatter = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

type RequestListProps = {
  requests: PurchaseRequestRow[];
  categories: CategoryRow[];
  applicantNames?: Record<string, string>;
  activeStatus?: PurchaseRequestStatus;
  isAdmin?: boolean;
};

export function RequestList({
  requests,
  categories,
  applicantNames = {},
  activeStatus,
  isAdmin = false,
}: RequestListProps) {
  const categoryNames = new Map(
    categories.map((category) => [category.id, category.name]),
  );

  return (
    <section className="grid min-w-0 gap-3">
      {isAdmin ? <StatusFilterNav activeStatus={activeStatus} /> : null}

      {requests.length === 0 ? (
        <div className="min-w-0 rounded-md border border-zinc-200 bg-white p-6 text-sm text-zinc-600 [overflow-wrap:anywhere]">
          {activeStatus
            ? `${statusFilterLabels[activeStatus]}の申請はありません。`
            : "表示できる申請はまだありません。"}
        </div>
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {requests.map((request) => (
              <Link
                className="block min-w-0 rounded-md border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-400 hover:shadow"
                href={`/requests/${request.id}`}
                key={request.id}
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-zinc-500">
                      申請内容
                    </p>
                    <h2 className="mt-1 break-words text-base font-semibold text-zinc-950 [overflow-wrap:anywhere]">
                      {request.title}
                    </h2>
                  </div>
                  <RequestStatusBadge status={request.status} />
                </div>
                <dl className="mt-4 grid gap-2 text-sm text-zinc-600">
                  {isAdmin ? (
                    <div className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] gap-3">
                      <dt>申請者</dt>
                      <dd className="min-w-0 text-right font-medium text-zinc-800 [overflow-wrap:anywhere]">
                        {applicantNames[request.applicant_id] ?? "不明"}
                      </dd>
                    </div>
                  ) : null}
                  <div className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] gap-3">
                    <dt>カテゴリ</dt>
                    <dd className="min-w-0 text-right font-medium text-zinc-800 [overflow-wrap:anywhere]">
                      {categoryNames.get(request.category_id) ?? "不明"}
                    </dd>
                  </div>
                  <div className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] gap-3">
                    <dt>金額</dt>
                    <dd className="min-w-0 text-right font-medium text-zinc-800 [overflow-wrap:anywhere]">
                      {yenFormatter.format(request.amount_jpy)}
                    </dd>
                  </div>
                  <div className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] gap-3">
                    <dt>申請日</dt>
                    <dd className="min-w-0 text-right font-medium text-zinc-800 [overflow-wrap:anywhere]">
                      {formatDate(request.requested_at)}
                    </dd>
                  </div>
                </dl>
                <p className="mt-4 text-sm font-medium text-zinc-950">
                  詳細を見る
                </p>
              </Link>
            ))}
          </div>
          <div className="hidden overflow-x-auto rounded-md border border-zinc-200 bg-white md:block">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
              <tr>
                <th className="px-4 py-3 font-medium">申請内容</th>
                {isAdmin ? (
                  <th className="px-4 py-3 font-medium">申請者</th>
                ) : null}
                <th className="px-4 py-3 font-medium">カテゴリ</th>
                <th className="px-4 py-3 font-medium">金額</th>
                <th className="px-4 py-3 font-medium">状態</th>
                <th className="px-4 py-3 font-medium">申請日</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr className="border-b border-zinc-100" key={request.id}>
                  <td className="max-w-[24rem] px-4 py-3 font-medium text-zinc-950">
                    <Link
                      className="break-words underline-offset-4 [overflow-wrap:anywhere] hover:underline"
                      href={`/requests/${request.id}`}
                    >
                      {request.title}
                    </Link>
                  </td>
                  {isAdmin ? (
                    <td className="max-w-[12rem] px-4 py-3 text-zinc-600 [overflow-wrap:anywhere]">
                      {applicantNames[request.applicant_id] ?? "不明"}
                    </td>
                  ) : null}
                  <td className="max-w-[10rem] px-4 py-3 text-zinc-600 [overflow-wrap:anywhere]">
                    {categoryNames.get(request.category_id) ?? "不明"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {yenFormatter.format(request.amount_jpy)}
                  </td>
                  <td className="px-4 py-3">
                    <RequestStatusBadge status={request.status} />
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {formatDate(request.requested_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </section>
  );
}
