import type { PurchaseRequestStatus } from "@/lib/repositories/types";
import { statusLabels } from "@/lib/ui-labels";

const statusClassName: Record<PurchaseRequestStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  rejected: "border-red-200 bg-red-50 text-red-800",
};

export function RequestStatusBadge({
  status,
}: {
  status: PurchaseRequestStatus;
}) {
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium ${statusClassName[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
