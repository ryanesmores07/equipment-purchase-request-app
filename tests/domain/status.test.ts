import { describe, expect, it } from "vitest";
import { canTransition, isTerminalStatus } from "@/lib/domain/status";

describe("request status transitions", () => {
  it("allows pending requests to be approved", () => {
    expect(canTransition("pending", "approved")).toBe(true);
  });

  it("allows pending requests to be rejected", () => {
    expect(canTransition("pending", "rejected")).toBe(true);
  });

  it("allows pending requests to be cancelled", () => {
    expect(canTransition("pending", "cancelled")).toBe(true);
  });

  it("prevents approved requests from changing", () => {
    expect(canTransition("approved", "pending")).toBe(false);
    expect(canTransition("approved", "rejected")).toBe(false);
  });

  it("prevents rejected requests from changing", () => {
    expect(canTransition("rejected", "pending")).toBe(false);
    expect(canTransition("rejected", "approved")).toBe(false);
  });

  it("treats approved and rejected as terminal statuses", () => {
    expect(isTerminalStatus("pending")).toBe(false);
    expect(isTerminalStatus("approved")).toBe(true);
    expect(isTerminalStatus("rejected")).toBe(true);
    expect(isTerminalStatus("cancelled")).toBe(true);
  });
});
