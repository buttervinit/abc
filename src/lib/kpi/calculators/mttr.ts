import { z } from "zod";
import { KpiCalculator } from "../types";

const schema = z.object({
  totalResponseHours: z.number().min(0),
  incidentCount: z.number().min(1),
});

export const mttr: KpiCalculator<typeof schema> = {
  code: "MTTR_INCIDENTS",
  unit: "hours",
  direction: "LOWER_IS_BETTER",
  target: 4,
  inputFields: [
    {
      key: "totalResponseHours",
      label: "Sum of response hours across all incidents",
      type: "number",
      help: "Total of (containment time − detection time) in hours, summed over incidents.",
    },
    {
      key: "incidentCount",
      label: "Number of incidents in period",
      type: "number",
      help: "Count of security incidents handled this period.",
    },
  ],
  inputSchema: schema,
  compute: (i) => i.totalResponseHours / i.incidentCount,
  formulaText:
    "Sum of (containment time − detection time) across all incidents ÷ number of incidents, in hours. Target: ≤ 4 hours (lower is better).",
};
