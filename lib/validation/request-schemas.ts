import { z } from "zod";

const optionalTrimmedText = (maxLength: number) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return value;
      }

      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    },
    z.string().max(maxLength).optional(),
  );

export const createRequestSchema = z.object({
  categoryId: z.uuid(),
  title: z.string().trim().min(1).max(120),
  description: optionalTrimmedText(1000),
  amountJpy: z.coerce.number().int().positive().max(10000000),
});

export const decideRequestSchema = z
  .object({
    status: z.enum(["approved", "rejected"]),
    decisionNote: optionalTrimmedText(500),
  })
  .superRefine((value, ctx) => {
    if (value.status === "rejected" && !value.decisionNote) {
      ctx.addIssue({
        code: "custom",
        path: ["decisionNote"],
        message: "Decision note is required when rejecting a request.",
      });
    }
  });

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
export type DecideRequestInput = z.infer<typeof decideRequestSchema>;
