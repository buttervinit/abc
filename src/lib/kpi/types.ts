import { z } from "zod";

export type Direction = "HIGHER_IS_BETTER" | "LOWER_IS_BETTER";

export type ComplianceStatus = "MEETS" | "DOES_NOT_MEET";

/**
 * Describes one numeric input the owner must provide. Used both to render the
 * submission form and to populate the KPI's `inputSchema` JSON in the database.
 */
export interface KpiInputField {
  key: string;
  label: string;
  type: "number";
  help?: string;
}

/**
 * A KPI calculator is the single source of truth for how a KPI is measured:
 * its required inputs, its formula, and its target/direction. KPI display
 * metadata in the database is derived from this at seed time and linked by `code`.
 */
export interface KpiCalculator<S extends z.ZodTypeAny = z.ZodTypeAny> {
  code: string;
  unit: string; // "%", "hours"
  direction: Direction;
  target: number;
  inputFields: KpiInputField[];
  inputSchema: S; // zod validation of the submitted inputs
  compute: (inputs: z.infer<S>) => number;
  /** How the KPI is measured — shown to owners and included in the AI prompt. */
  formulaText: string;
}

/**
 * Evaluate whether a computed value meets its target, honoring the KPI's
 * direction (higher-is-better vs lower-is-better).
 */
export function evaluateCompliance(
  value: number,
  target: number,
  direction: Direction,
): ComplianceStatus {
  const meets =
    direction === "HIGHER_IS_BETTER" ? value >= target : value <= target;
  return meets ? "MEETS" : "DOES_NOT_MEET";
}
