import { z } from "zod";
import { KpiCalculator } from "./types";
import { vulnRemediation } from "./calculators/vulnRemediation";
import { trainingCompletion } from "./calculators/trainingCompletion";
import { phishingFailure } from "./calculators/phishingFailure";
import { mttr } from "./calculators/mttr";
import { accessReview } from "./calculators/accessReview";

// Calculators have differently-shaped input schemas, so the collection erases
// the schema generic (each calculator file keeps its own strong typing). The
// erased `compute` accepts `any` because callers feed it the schema-parsed data.
type AnyKpiCalculator = Omit<KpiCalculator, "inputSchema" | "compute"> & {
  inputSchema: z.ZodTypeAny;
  compute: (inputs: any) => number;
};

const calculators: AnyKpiCalculator[] = [
  vulnRemediation,
  trainingCompletion,
  phishingFailure,
  mttr,
  accessReview,
];

/** All KPI calculators keyed by KPI code. */
export const KPI_REGISTRY: Record<string, AnyKpiCalculator> = Object.fromEntries(
  calculators.map((c) => [c.code, c]),
);

export const ALL_CALCULATORS = calculators;

export function getCalculator(code: string): AnyKpiCalculator {
  const calc = KPI_REGISTRY[code];
  if (!calc) {
    throw new Error(`No calculator registered for KPI code "${code}"`);
  }
  return calc;
}
