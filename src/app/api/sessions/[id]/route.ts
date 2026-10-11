import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loadScenario } from "@/lib/scenarios";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const { id } = params;

  const session = await db.session.findUnique({
    where: { id },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  let scenario = null;
  try {
    scenario = loadScenario(session.scenarioId);
  } catch (e) {
    console.error(`Failed to load scenario ${session.scenarioId}:`, e);
  }

  return NextResponse.json({ session: { ...session, scenario } });
}
