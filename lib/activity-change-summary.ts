import type {
  CategoryRow,
  RequestActivityChanges,
} from "@/lib/repositories/types";

type ChangeSummary = {
  field: string;
  from: string;
  to: string;
};

const editableFields = [
  "category_id",
  "title",
  "description",
  "amount_jpy",
] as const;

const yenFormatter = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

export function getActivityChangeSummaries(
  changes: RequestActivityChanges | null,
  categories: CategoryRow[],
): ChangeSummary[] {
  if (!changes) {
    return [];
  }

  const categoryNames = new Map(
    categories.map((category) => [category.id, category.name]),
  );

  return editableFields.flatMap((field) => {
    const change = changes[field];
    if (!change) {
      return [];
    }

    switch (field) {
      case "category_id":
        return [
          {
            field: "カテゴリ",
            from: formatCategory(change.from, categoryNames),
            to: formatCategory(change.to, categoryNames),
          },
        ];
      case "amount_jpy":
        return [
          {
            field: "金額",
            from: formatAmount(change.from),
            to: formatAmount(change.to),
          },
        ];
      case "title":
        return [
          {
            field: "タイトル",
            from: formatText(change.from),
            to: formatText(change.to),
          },
        ];
      case "description":
        return [
          {
            field: "補足説明",
            from: formatText(change.from),
            to: formatText(change.to),
          },
        ];
    }
  });
}

function formatCategory(
  value: string | number | null,
  categoryNames: Map<string, string>,
) {
  if (typeof value !== "string") {
    return "未入力";
  }

  return categoryNames.get(value) ?? "不明なカテゴリ";
}

function formatAmount(value: string | number | null) {
  if (typeof value === "number") {
    return yenFormatter.format(value);
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? yenFormatter.format(parsed) : value;
  }

  return "未入力";
}

function formatText(value: string | number | null) {
  if (value === null || value === "") {
    return "未入力";
  }

  return String(value);
}
