import Link from "next/link";
import { RequestStatusBadge } from "@/components/request-status-badge";
import { requestStatuses } from "@/lib/domain/status";
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
    <section className="grid gap-3">
      {isAdmin ? <StatusFilters activeStatus={activeStatus} /> : null}

      {requests.length === 0 ? (
        <div className="rounded-md border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          {activeStatus
            ? `${statusFilterLabels[activeStatus]}の申請はありません。`
            : "表示できる申請はまだありません。"}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-zinc-200 bg-white">
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
                  <td className="px-4 py-3 font-medium text-zinc-950">
                    <Link
                      className="underline-offset-4 hover:underline"
                      href={`/requests/${request.id}`}
                    >
                      {request.title}
                    </Link>
                  </td>
                  {isAdmin ? (
                    <td className="px-4 py-3 text-zinc-600">
                      {applicantNames[request.applicant_id] ?? "不明"}
                    </td>
                  ) : null}
                  <td className="px-4 py-3 text-zinc-600">
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
      )}
    </section>
  );
}

function StatusFilters({
  activeStatus,
}: {
  activeStatus?: PurchaseRequestStatus;
}) {
  const filters = [
    { label: statusFilterLabels.all, href: "/requests", value: undefined },
    ...requestStatuses.map((status) => ({
      label: statusFilterLabels[status],
      href: `/requests?status=${status}`,
      value: status,
    })),
  ];

  return (
    <nav aria-label="申請状態フィルター" className="flex flex-wrap gap-2">
      {filters.map((filter) => {
        const isActive = filter.value === activeStatus;
        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
              isActive
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-300 bg-white text-zinc-700"
            }`}
            href={filter.href}
            key={filter.href}
          >
            {filter.label}
          </Link>
        );
      })}
    </nav>
  );
}
