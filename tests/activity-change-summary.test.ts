import { describe, expect, it } from "vitest";
import { getActivityChangeSummaries } from "@/lib/activity-change-summary";
import type { CategoryRow } from "@/lib/repositories/types";

const categories: CategoryRow[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Office equipment",
    sort_order: 1,
    created_at: "2026-05-25T00:00:00.000Z",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Software",
    sort_order: 2,
    created_at: "2026-05-25T00:00:00.000Z",
  },
];

describe("getActivityChangeSummaries", () => {
  it("formats edited amount and title changes", () => {
    const summaries = getActivityChangeSummaries(
      {
        amount_jpy: { from: 50000, to: 65000 },
        title: { from: "Old laptop", to: "Replacement laptop" },
      },
      categories,
    );

    expect(summaries).toEqual([
      {
        field: "タイトル",
        from: "Old laptop",
        to: "Replacement laptop",
      },
      {
        field: "金額",
        from: "￥50,000",
        to: "￥65,000",
      },
    ]);
  });

  it("formats category IDs as category names", () => {
    const summaries = getActivityChangeSummaries(
      {
        category_id: {
          from: "11111111-1111-4111-8111-111111111111",
          to: "22222222-2222-4222-8222-222222222222",
        },
      },
      categories,
    );

    expect(summaries).toEqual([
      {
        field: "カテゴリ",
        from: "Office equipment",
        to: "Software",
      },
    ]);
  });

  it("uses a readable empty label for cleared descriptions", () => {
    const summaries = getActivityChangeSummaries(
      {
        description: {
          from: "Need this for onboarding.",
          to: null,
        },
      },
      categories,
    );

    expect(summaries).toEqual([
      {
        field: "補足説明",
        from: "Need this for onboarding.",
        to: "未入力",
      },
    ]);
  });
});
