import { z } from "zod";
import { requestInputLimits } from "@/lib/request-limits";

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
  title: z.string().trim().min(1).max(requestInputLimits.title),
  description: optionalTrimmedText(requestInputLimits.description),
  amountJpy: z.coerce.number().int().positive().max(requestInputLimits.amountJpy),
});

export const updateRequestSchema = createRequestSchema;

export const decideRequestSchema = z
  .object({
    status: z.enum(["approved", "rejected"]),
    decisionNote: optionalTrimmedText(requestInputLimits.decisionNote),
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

export const cancelRequestSchema = z.object({
  cancellationNote: optionalTrimmedText(requestInputLimits.cancellationNote),
  confirmCancel: z.literal("on"),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
export type UpdateRequestInput = z.infer<typeof updateRequestSchema>;
export type DecideRequestInput = z.infer<typeof decideRequestSchema>;
export type CancelRequestInput = z.infer<typeof cancelRequestSchema>;
