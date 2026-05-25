const actionFeedbackMessages = {
  created: "申請を作成しました。",
  updated: "申請を更新しました。",
  cancelled: "申請をキャンセルしました。",
  approved: "申請を承認しました。",
  rejected: "申請を却下しました。",
} as const;

export type ActionFeedbackResult = keyof typeof actionFeedbackMessages;

export function getActionFeedbackResult(
  value: string | string[] | undefined,
): ActionFeedbackResult | undefined {
  const result = Array.isArray(value) ? value[0] : value;

  return result && result in actionFeedbackMessages
    ? (result as ActionFeedbackResult)
    : undefined;
}

export function ActionFeedbackBanner({
  result,
}: {
  result: ActionFeedbackResult;
}) {
  return (
    <p
      className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"
      role="status"
    >
      {actionFeedbackMessages[result]}
    </p>
  );
}
