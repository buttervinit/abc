import { z } from "zod";
import { KpiCalculator } from "../types";

const schema = z.object({
  reviewsCompleted: z.number().min(0),
  reviewsRequired: z.number().min(1),
});

export const accessReview: KpiCalculator<typeof schema> = {
  code: "ACCESS_REVIEW",
  unit: "%",
  direction: "HIGHER_IS_BETTER",
  target: 100,
  inputFields: [
    {
      key: "reviewsCompleted",
      label: "Privileged/user access reviews completed",
      type: "number",
      help: "Count of required access reviews completed this period.",
    },
    {
      key: "reviewsRequired",
      label: "Access reviews required in period",
      type: "number",
      help: "Total access reviews scheduled/required this period.",
    },
  ],
  inputSchema: schema,
  compute: (i) => (i.reviewsCompleted / i.reviewsRequired) * 100,
  formulaText:
    "(# privileged/user access reviews completed ÷ total access reviews required) × 100. Target: = 100%.",
};
