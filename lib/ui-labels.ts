import type { PurchaseRequestStatus } from "@/lib/repositories/types";

export const statusLabels: Record<PurchaseRequestStatus, string> = {
  pending: "申請中",
  approved: "承認済み",
  rejected: "却下済み",
  cancelled: "キャンセル済み",
};

export const roleLabels = {
  employee: "申請者",
  admin: "管理者",
} as const;

export const statusFilterLabels = {
  all: "すべて",
  ...statusLabels,
} as const;

export const activityLabels = {
  created: "申請を作成",
  edited: "申請を編集",
  cancelled: "申請をキャンセル",
  approved: "申請を承認",
  rejected: "申請を却下",
} as const;

export function formatDate(value: string | null) {
  if (!value) {
    return "未定";
  }

  return new Date(value).toLocaleDateString("ja-JP");
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ja-JP");
}
