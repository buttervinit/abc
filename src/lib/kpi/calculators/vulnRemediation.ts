import { z } from "zod";
import { KpiCalculator } from "../types";

const schema = z.object({
  remediatedWithinSla: z.number().min(0),
  totalCriticalHigh: z.number().min(1),
});

export const vulnRemediation: KpiCalculator<typeof schema> = {
  code: "VULN_REMEDIATION_SLA",
  unit: "%",
  direction: "HIGHER_IS_BETTER",
  target: 95,
  inputFields: [
    {
      key: "remediatedWithinSla",
      label: "Critical/High vulnerabilities remediated within SLA",
      type: "number",
      help: "Count of critical/high vulns closed within the SLA window this period.",
    },
    {
      key: "totalCriticalHigh",
      label: "Total critical/high vulnerabilities in period",
      type: "number",
      help: "All critical/high vulns identified during the period.",
    },
  ],
  inputSchema: schema,
  compute: (i) => (i.remediatedWithinSla / i.totalCriticalHigh) * 100,
  formulaText:
    "(# critical/high vulnerabilities remediated within the SLA window ÷ total critical/high vulnerabilities) × 100. Target: ≥ 95%.",
};
