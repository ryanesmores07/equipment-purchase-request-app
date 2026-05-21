import { notFound } from "next/navigation";
import { ApprovalPanel } from "@/components/approval-panel";
import { RequestStatusBadge } from "@/components/request-status-badge";
import { requireUser } from "@/lib/auth/require-user";
import { getProfileById } from "@/lib/repositories/profiles.repo";
import { listCategories } from "@/lib/repositories/categories.repo";
import { listApprovalHistory } from "@/lib/repositories/history.repo";
import { getRequestById } from "@/lib/repositories/requests.repo";

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

  return (
    <section className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-950">
            {request.title}
          </h1>
          <p className="text-sm text-zinc-600">
            Requested on{" "}
            {new Date(request.requested_at).toLocaleDateString("ja-JP")}
          </p>
        </div>
        <RequestStatusBadge status={request.status} />
      </div>
      <dl className="grid gap-4 rounded-md border border-zinc-200 bg-white p-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase text-zinc-500">
            Category
          </dt>
          <dd className="mt-1 text-sm text-zinc-950">
            {category?.name ?? "Unknown"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-zinc-500">
            Amount
          </dt>
          <dd className="mt-1 text-sm text-zinc-950">
            {yenFormatter.format(request.amount_jpy)}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase text-zinc-500">
            Description
          </dt>
          <dd className="mt-1 whitespace-pre-wrap text-sm text-zinc-950">
            {request.description || "No description provided."}
          </dd>
        </div>
        {request.decision_note ? (
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase text-zinc-500">
              Decision note
            </dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm text-zinc-950">
              {request.decision_note}
            </dd>
          </div>
        ) : null}
      </dl>
      {profile?.role === "admin" && request.status === "pending" ? (
        <ApprovalPanel requestId={request.id} />
      ) : null}
      <section className="grid gap-3">
        <h2 className="text-lg font-semibold text-zinc-950">
          Approval history
        </h2>
        {history.length === 0 ? (
          <p className="rounded-md border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
            No decision history yet.
          </p>
        ) : (
          <ol className="grid gap-2">
            {history.map((item) => (
              <li
                className="rounded-md border border-zinc-200 bg-white p-4 text-sm"
                key={item.id}
              >
                <span className="font-medium text-zinc-950">
                  {item.from_status} to {item.to_status}
                </span>
                <span className="ml-2 text-zinc-500">
                  {new Date(item.acted_at).toLocaleString("ja-JP")}
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
