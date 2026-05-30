import { PrismaClient, Prisma } from "@prisma/client";
import { ALL_CALCULATORS } from "../src/lib/kpi/registry";

const db = new PrismaClient();

// Human-facing display metadata per KPI code. The numeric/formula fields are
// derived from the calculator registry so the two never drift.
const DISPLAY: Record<string, { name: string; description: string; goalText: string }> = {
  VULN_REMEDIATION_SLA: {
    name: "Critical/High Vulnerability Remediation within SLA",
    description:
      "Measures how effectively critical and high severity vulnerabilities are remediated within the defined SLA window (ISO 27001 A.8.8 — management of technical vulnerabilities).",
    goalText: "≥ 95%",
  },
  TRAINING_COMPLETION: {
    name: "Security Awareness Training Completion",
    description:
      "Measures the share of in-scope employees who completed mandatory security awareness training (ISO 27001 A.6.3 — information security awareness, education and training).",
    goalText: "≥ 98%",
  },
  PHISHING_FAILURE: {
    name: "Phishing Simulation Failure Rate",
    description:
      "Measures the percentage of users who clicked or submitted credentials during a phishing simulation. Lower is better.",
    goalText: "≤ 5%",
  },
  MTTR_INCIDENTS: {
    name: "Mean Time to Respond to Incidents (MTTR)",
    description:
      "Average time from incident detection to containment/response (ISO 27001 A.5.24–A.5.26 — incident management). Lower is better.",
    goalText: "≤ 4 hours",
  },
  ACCESS_REVIEW: {
    name: "Privileged/User Access Review Completion",
    description:
      "Measures completion of required periodic access reviews (ISO 27001 A.5.18 — access rights).",
    goalText: "= 100%",
  },
};

async function main() {
  // Demo users (auto-provisioned on first SSO login in production; seeded here
  // so the MVP runs with the dev-login provider before live Entra is wired).
  const admin = await db.user.upsert({
    where: { email: "grc.admin@godrejinds.com" },
    update: { role: "ADMIN" },
    create: { name: "GRC Admin", email: "grc.admin@godrejinds.com", role: "ADMIN" },
  });

  const priya = await db.user.upsert({
    where: { email: "priya.nair@godrejinds.com" },
    update: { role: "OWNER" },
    create: { name: "Priya Nair", email: "priya.nair@godrejinds.com", role: "OWNER" },
  });

  const sam = await db.user.upsert({
    where: { email: "sam.lee@godrejinds.com" },
    update: { role: "OWNER" },
    create: { name: "Sam Lee", email: "sam.lee@godrejinds.com", role: "OWNER" },
  });

  // KPIs derived from the calculator registry.
  const kpiByCode: Record<string, string> = {};
  for (const calc of ALL_CALCULATORS) {
    const display = DISPLAY[calc.code];
    if (!display) throw new Error(`Missing display metadata for ${calc.code}`);

    const data = {
      name: display.name,
      description: display.description,
      goalText: display.goalText,
      target: calc.target,
      direction: calc.direction,
      unit: calc.unit,
      formulaText: calc.formulaText,
      inputSchema: calc.inputFields as unknown as Prisma.InputJsonValue,
    };

    const kpi = await db.kpi.upsert({
      where: { code: calc.code },
      update: data,
      create: { code: calc.code, ...data },
    });
    kpiByCode[calc.code] = kpi.id;
  }

  // Seed a few assignments so routing is visible out of the box.
  const assignments: Array<[string, string]> = [
    ["VULN_REMEDIATION_SLA", priya.id],
    ["MTTR_INCIDENTS", priya.id],
    ["TRAINING_COMPLETION", sam.id],
    ["PHISHING_FAILURE", sam.id],
    ["ACCESS_REVIEW", sam.id],
  ];

  for (const [code, ownerId] of assignments) {
    await db.kpiAssignment.upsert({
      where: { kpiId_ownerId: { kpiId: kpiByCode[code], ownerId } },
      update: {},
      create: { kpiId: kpiByCode[code], ownerId, assignedById: admin.id },
    });
  }

  console.log("Seed complete:");
  console.log(`  users:       ${[admin, priya, sam].map((u) => u.email).join(", ")}`);
  console.log(`  kpis:        ${ALL_CALCULATORS.length}`);
  console.log(`  assignments: ${assignments.length}`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
