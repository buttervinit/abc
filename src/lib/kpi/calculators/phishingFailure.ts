import { z } from "zod";
import { KpiCalculator } from "../types";

const schema = z.object({
  usersFailed: z.number().min(0),
  usersTested: z.number().min(1),
});

export const phishingFailure: KpiCalculator<typeof schema> = {
  code: "PHISHING_FAILURE",
  unit: "%",
  direction: "LOWER_IS_BETTER",
  target: 5,
  inputFields: [
    {
      key: "usersFailed",
      label: "Users who clicked/failed the phishing simulation",
      type: "number",
      help: "Count of users who clicked the link or submitted credentials.",
    },
    {
      key: "usersTested",
      label: "Total users included in the simulation",
      type: "number",
      help: "All users who received the simulated phishing email.",
    },
  ],
  inputSchema: schema,
  compute: (i) => (i.usersFailed / i.usersTested) * 100,
  formulaText:
    "(# users who clicked/failed the phishing simulation ÷ total users tested) × 100. Target: ≤ 5% (lower is better).",
};
