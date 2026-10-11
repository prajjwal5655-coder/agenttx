import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const CreateSessionSchema = z.object({
  facilitator: z.string().min(1),
  scenarioId: z.string().min(1),
  clientId: z.string().optional(),
  blastMapId: z.string().optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const parsed = CreateSessionSchema.parse(body);

    const session = await db.session.create({
      data: {
        clientId: parsed.clientId,
        facilitator: parsed.facilitator,
        scenarioId: parsed.scenarioId,
        scenarioVersion: "",
        blastMapId: parsed.blastMapId,
        startedAt: new Date(),
        status: "draft",
      },
    });

    return NextResponse.json({ id: session.id });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors.map((err) => err.message).join(", ") }, { status: 400 });
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const sessions = await db.session.findMany({
    orderBy: { startedAt: "desc" },
  });
  return NextResponse.json({ sessions });
}
