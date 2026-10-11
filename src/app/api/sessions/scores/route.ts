import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const ScoreSchema = z.object({
  dimensionKey: z.string(),
  value: z.number().int().min(1).max(5),
  rationale: z.string().optional(),
  roleId: z.string().optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const parsed = ScoreSchema.parse(body);

    const score = await db.score.create({
      data: {
        sessionId,
        dimensionKey: parsed.dimensionKey,
        value: parsed.value,
        rationale: parsed.rationale ?? "",
        roleId: parsed.roleId,
      },
    });

    return NextResponse.json({ id: score.id });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors.map((err) => err.message).join(", ") }, { status: 400 });
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  const scores = await db.score.findMany({ where: { sessionId } });
  return NextResponse.json({ scores });
}
