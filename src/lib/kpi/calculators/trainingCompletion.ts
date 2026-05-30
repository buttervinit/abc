import { z } from "zod";
import { KpiCalculator } from "../types";

const schema = z.object({
  employeesCompleted: z.number().min(0),
  employeesRequired: z.number().min(1),
});

export const trainingCompletion: KpiCalculator<typeof schema> = {
  code: "TRAINING_COMPLETION",
  unit: "%",
  direction: "HIGHER_IS_BETTER",
  target: 98,
  inputFields: [
    {
      key: "employeesCompleted",
      label: "Employees who completed mandatory training",
      type: "number",
      help: "Count of employees who finished the required security awareness training.",
    },
    {
      key: "employeesRequired",
      label: "Employees required to complete training",
      type: "number",
      help: "Total employees in scope for mandatory training this period.",
    },
  ],
  inputSchema: schema,
  compute: (i) => (i.employeesCompleted / i.employeesRequired) * 100,
  formulaText:
    "(# employees who completed mandatory security awareness training ÷ total employees required) × 100. Target: ≥ 98%.",
};
