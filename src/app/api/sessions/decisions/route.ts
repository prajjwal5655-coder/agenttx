import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseJsonColumn } from "@/lib/db";
import { z } from "zod";

const CriteriaConfirmedSchema = z.record(z.boolean());

const DecisionSchema = z.object({
  checkpointId: z.string(),
  summary: z.string(),
  decidedBy: z.string(),
  elapsedSeconds: z.number().int().nonnegative(),
  criteriaConfirmed: CriteriaConfirmedSchema,
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const parsed = DecisionSchema.parse(body);

    const decision = await db.decision.create({
      data: {
        sessionId,
        checkpointId: parsed.checkpointId,
        summary: parsed.summary,
        decidedBy: parsed.decidedBy,
        elapsedSeconds: parsed.elapsedSeconds,
        criteriaConfirmed: JSON.stringify(parsed.criteriaConfirmed),
      },
    });

    return NextResponse.json({ id: decision.id });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors.map((err) => err.message).join(", ") }, { status: 400 });
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
