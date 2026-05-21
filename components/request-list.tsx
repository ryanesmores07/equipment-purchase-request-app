import Link from "next/link";
import { RequestStatusBadge } from "@/components/request-status-badge";
import type {
  CategoryRow,
  PurchaseRequestRow,
} from "@/lib/repositories/types";

const yenFormatter = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

export function RequestList({
  requests,
  categories,
}: {
  requests: PurchaseRequestRow[];
  categories: CategoryRow[];
}) {
  const categoryNames = new Map(
    categories.map((category) => [category.id, category.name]),
  );

  if (requests.length === 0) {
    return (
      <section className="rounded-md border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
        No purchase requests yet.
      </section>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-zinc-200 bg-white">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
          <tr>
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Requested</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr className="border-b border-zinc-100" key={request.id}>
              <td className="px-4 py-3 font-medium text-zinc-950">
                <Link href={`/requests/${request.id}`}>{request.title}</Link>
              </td>
              <td className="px-4 py-3 text-zinc-600">
                {categoryNames.get(request.category_id) ?? "Unknown"}
              </td>
              <td className="px-4 py-3 text-zinc-600">
                {yenFormatter.format(request.amount_jpy)}
              </td>
              <td className="px-4 py-3">
                <RequestStatusBadge status={request.status} />
              </td>
              <td className="px-4 py-3 text-zinc-600">
                {new Date(request.requested_at).toLocaleDateString("ja-JP")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
