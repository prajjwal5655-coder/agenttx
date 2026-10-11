import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loadScenario } from "@/lib/scenarios";
import { pdf, renderToStream } from "@react-pdf/renderer";
import { ReportDocument, ReportData } from "@/lib/pdf/report";
import React from "react";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId");
  const format = url.searchParams.get("format") ?? "pdf";

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  const session = await db.session.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  let scenario;
  try {
    scenario = loadScenario(session.scenarioId);
  } catch (e) {
    return NextResponse.json({ error: `Scenario not found: ${e}` }, { status: 404 });
  }

  const decisions = await db.decision.findMany({ where: { sessionId } });
  const scores = await db.score.findMany({ where: { sessionId } });
  const remediations = await db.remediationItem.findMany({ where: { sessionId } });

  const reportData: ReportData = {
    session: {
      id: session.id,
      facilitator: session.facilitator,
      scenarioId: session.scenarioId,
      scenarioVersion: session.scenarioVersion,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      status: session.status,
    },
    scenario: scenario as unknown as ReportData["scenario"],
    decisions: decisions.map((d) => ({
      checkpointId: d.checkpointId,
      prompt: "",
      selectedOption: "",
      elapsedSeconds: d.elapsedSeconds,
      criteriaConfirmed: JSON.parse(d.criteriaConfirmed),
    })),
    scores: Object.fromEntries(scores.map((s) => [s.dimensionKey, s.value])),
    remediations: remediations.map((r) => ({
      gap: r.gap,
      severity: r.severity,
      recommendation: r.recommendation,
      ownerRole: r.ownerRole,
      dueDate: r.dueDate ? r.dueDate.toISOString() : null,
      status: r.status,
    })),
    blastRadiusSummary: null,
  };

  if (format === "json") {
    return NextResponse.json({ report: reportData });
  }

  if (format === "markdown") {
    const markdown = generateMarkdown(reportData);
    return NextResponse.json({ markdown });
  }

  const stream = await renderToStream(<ReportDocument data={reportData} />);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const buffer = Buffer.concat(chunks);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="agentttx-report-${sessionId}.pdf"`,
    },
  });
}

function generateMarkdown(data: ReportData): string {
  const scenario = data.scenario;
  const session = data.session;

  let md = "# AgentTTX After-Action Report\n\n";
  md += `## 1. Board One-Pager\n\n`;
  md += `**Scenario:** ${scenario.title}\n`;
  md += `**Date:** ${new Date(session.startedAt).toLocaleDateString()}\n`;
  md += `**Facilitator:** ${session.facilitator}\n\n`;

  md += `## 2. Test Evidence Block\n\n`;
  md += `### Exercise Details\n`;
  md += `- Exercise date: ${new Date(session.startedAt).toLocaleDateString()}\n`;
  md += `- Scenario version: ${session.scenarioVersion}\n\n`;

  md += `### Decisions Made\n`;
  for (const d of data.decisions) {
    md += `- Decision at ${d.elapsedSeconds}s: ${d.selectedOption}\n`;
  }
  md += `\n### Remediation Items\n`;
  for (const r of data.remediations) {
    md += `- Gap: ${r.gap}\n`;
    md += `  - Recommendation: ${r.recommendation}\n`;
    md += `  - Owner: ${r.ownerRole}\n`;
    md += `  - Due: ${r.dueDate ?? "TBD"}\n`;
    md += `  - Status: ${r.status}\n`;
  }

  md += `\n## 3. Decision-vs-Inject Timeline\n\n`;
  md += `| Minute | Event |\n|--------|-------|\n`;
  for (const inj of scenario.injects) {
    md += `| ${inj.at_minute}m | INJECT: ${inj.title} |\n`;
  }

  md += `\n## 4. Scorecard\n\n`;
  md += "Dimension scores will appear here.\n\n";

  md += `## 5. Regulation Citations\n\n`;
  for (const rec of scenario.recommendations) {
    for (const ref of rec.regulation_refs) {
      md += `- ${ref}: See regulation file\n`;
    }
  }

  md += `\n## 6. Appendix\n\n`;
  md += `Scenario version: ${session.scenarioVersion}\n`;
  md += `\n---\n`;
  md += `Note: Regulation citations are illustrative only. See legal disclaimer.\n`;

  return md;
}
