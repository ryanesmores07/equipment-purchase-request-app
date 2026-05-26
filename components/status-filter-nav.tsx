"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestStatuses } from "@/lib/domain/status";
import type { PurchaseRequestStatus } from "@/lib/repositories/types";
import { statusFilterLabels } from "@/lib/ui-labels";

type StatusFilterNavProps = {
  activeStatus?: PurchaseRequestStatus;
};

export function StatusFilterNav({ activeStatus }: StatusFilterNavProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const filters = [
    { label: statusFilterLabels.all, href: "/requests", value: undefined },
    ...requestStatuses.map((status) => ({
      label: statusFilterLabels[status],
      href: `/requests?status=${status}`,
      value: status,
    })),
  ];

  useEffect(() => {
    setPendingHref(null);
  }, [activeStatus]);

  return (
    <div className="grid min-w-0 gap-2">
      <nav
        aria-label="申請ステータスフィルター"
        className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"
      >
        {filters.map((filter) => {
          const isActive = filter.value === activeStatus;
          const isFilterPending = isPending && pendingHref === filter.href;

          return (
            <button
              aria-current={isActive ? "page" : undefined}
              className={`min-w-0 rounded-md border px-3 py-1.5 text-sm font-medium transition [overflow-wrap:anywhere] ${
                isActive
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500"
              } ${isFilterPending ? "cursor-wait opacity-70" : ""}`}
              disabled={isActive || isFilterPending}
              key={filter.href}
              onClick={() => {
                setPendingHref(filter.href);
                startTransition(() => {
                  router.push(filter.href);
                });
              }}
              type="button"
            >
              {filter.label}
              {isFilterPending ? "..." : ""}
            </button>
          );
        })}
      </nav>
      {isPending ? (
        <p aria-live="polite" className="text-xs font-medium text-zinc-500">
          表示を切り替えています...
        </p>
      ) : null}
    </div>
  );
}
