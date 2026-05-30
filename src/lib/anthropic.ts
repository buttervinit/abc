import Anthropic from "@anthropic-ai/sdk";
import { KpiInputField } from "./kpi/types";

export interface RelevanceVerdict {
  relevant: boolean;
  /** Short explanation of the verdict. */
  reason: string;
  /** Actionable guidance for the owner when the submission is not relevant. */
  guidance: string;
  /** True when validation was bypassed because no API key is configured. */
  skipped?: boolean;
}

const MODEL = "claude-sonnet-4-5";

/**
 * Ask Claude whether the owner's submitted details and evidence are relevant to
 * how this KPI is measured. The model returns a structured verdict plus, on
 * failure, actionable guidance so the owner can correct and resubmit.
 *
 * Failure modes:
 *  - No API key  -> { relevant: true, skipped: true } so the app runs offline.
 *  - Parse error -> { relevant: false } (fail-closed; appropriate for compliance).
 */
export async function validateEvidenceRelevance(args: {
  kpiName: string;
  formulaText: string;
  inputFields: KpiInputField[];
  inputs: Record<string, number>;
  narrative: string;
  evidenceFileNames: string[];
}): Promise<RelevanceVerdict> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      relevant: true,
      reason: "Validation skipped: ANTHROPIC_API_KEY is not configured.",
      guidance: "",
      skipped: true,
    };
  }

  const client = new Anthropic({ apiKey });

  const fieldList = args.inputFields
    .map((f) => `- ${f.key} (${f.label})`)
    .join("\n");

  const prompt = `You are a GRC compliance reviewer for an ISO 27001 ISMS program.
Decide whether the KPI owner's submitted details and evidence are RELEVANT to how
this specific KPI is measured. You are NOT verifying the exact numbers — only that
the narrative and evidence plausibly substantiate the KIND of data this formula needs.

KPI: ${args.kpiName}
How it is measured: ${args.formulaText}
Required numeric inputs:
${fieldList}
Submitted inputs: ${JSON.stringify(args.inputs)}
Owner narrative: ${args.narrative || "(none provided)"}
Evidence file names: ${args.evidenceFileNames.join(", ") || "(none attached)"}

Relevant means the narrative/evidence is the right type of source for this KPI
(e.g. vulnerability scan exports for vulnerability remediation; LMS/training records
for training completion; phishing simulation platform reports for phishing failure;
incident tickets/timelines for MTTR; access certification reports for access review).
Irrelevant means it is off-topic, generic, or unrelated to the formula's inputs.

Respond with ONLY a JSON object, no prose, in exactly this shape:
{"relevant": <boolean>, "reason": "<one sentence>", "guidance": "<empty string if relevant; otherwise specific, actionable steps telling the owner exactly what evidence/inputs to provide to pass>"}`;

  let text = "";
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    });
    text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
  } catch (err) {
    return {
      relevant: false,
      reason: "Could not reach the validation service.",
      guidance:
        "The AI validation service was unavailable. Please try resubmitting shortly.",
    };
  }

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    return {
      relevant: Boolean(parsed.relevant),
      reason: String(parsed.reason ?? ""),
      guidance: String(parsed.guidance ?? ""),
    };
  } catch {
    return {
      relevant: false,
      reason: "Could not parse the validation response; held for safety.",
      guidance:
        "Please re-upload clearer evidence that directly supports this KPI's inputs (see the formula above) and resubmit.",
    };
  }
}
