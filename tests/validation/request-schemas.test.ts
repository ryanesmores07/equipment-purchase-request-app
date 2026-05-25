import { describe, expect, it } from "vitest";
import {
  cancelRequestSchema,
  createRequestSchema,
  decideRequestSchema,
  updateRequestSchema,
} from "@/lib/validation/request-schemas";

const validCreateRequest = {
  categoryId: "11111111-1111-4111-8111-111111111111",
  title: "Laptop replacement",
  description: "Current device is no longer reliable.",
  amountJpy: 180000,
};

describe("createRequestSchema", () => {
  it("accepts a valid purchase request", () => {
    expect(createRequestSchema.safeParse(validCreateRequest).success).toBe(
      true,
    );
  });

  it("rejects non-positive amounts", () => {
    const result = createRequestSchema.safeParse({
      ...validCreateRequest,
      amountJpy: 0,
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty titles", () => {
    const result = createRequestSchema.safeParse({
      ...validCreateRequest,
      title: "   ",
    });

    expect(result.success).toBe(false);
  });

  it("rejects titles longer than 120 characters", () => {
    const result = createRequestSchema.safeParse({
      ...validCreateRequest,
      title: "a".repeat(121),
    });

    expect(result.success).toBe(false);
  });

  it("trims optional blank descriptions to undefined", () => {
    const result = createRequestSchema.safeParse({
      ...validCreateRequest,
      description: "   ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeUndefined();
    }
  });
});

describe("decideRequestSchema", () => {
  it("accepts approval without a note", () => {
    expect(
      decideRequestSchema.safeParse({
        status: "approved",
        decisionNote: "",
      }).success,
    ).toBe(true);
  });

  it("requires a decision note when rejecting", () => {
    const result = decideRequestSchema.safeParse({
      status: "rejected",
      decisionNote: " ",
    });

    expect(result.success).toBe(false);
  });

  it("accepts rejection with a note", () => {
    expect(
      decideRequestSchema.safeParse({
        status: "rejected",
        decisionNote: "Budget exceeds this quarter's limit.",
      }).success,
    ).toBe(true);
  });
});

describe("updateRequestSchema", () => {
  it("accepts the same editable fields as create request", () => {
    expect(updateRequestSchema.safeParse(validCreateRequest).success).toBe(
      true,
    );
  });

  it("rejects invalid edited amounts", () => {
    const result = updateRequestSchema.safeParse({
      ...validCreateRequest,
      amountJpy: 10000001,
    });

    expect(result.success).toBe(false);
  });
});

describe("cancelRequestSchema", () => {
  it("accepts cancellation with confirmation and an optional note", () => {
    expect(
      cancelRequestSchema.safeParse({
        cancellationNote: "No longer needed.",
        confirmCancel: "on",
      }).success,
    ).toBe(true);
  });

  it("requires explicit cancellation confirmation", () => {
    const result = cancelRequestSchema.safeParse({
      cancellationNote: "No longer needed.",
      confirmCancel: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects cancellation notes longer than 500 characters", () => {
    const result = cancelRequestSchema.safeParse({
      cancellationNote: "a".repeat(501),
      confirmCancel: "on",
    });

    expect(result.success).toBe(false);
  });
});
