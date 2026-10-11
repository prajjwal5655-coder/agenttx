import { NextRequest, NextResponse } from "next/server";
import { loadAllScenarios } from "@/lib/scenarios";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const scenarios = loadAllScenarios();
  const list = Array.from(scenarios.values()).map((s) => ({
    id: s.id,
    title: s.title,
    version: s.version,
  }));
  return NextResponse.json({ scenarios: list });
}
