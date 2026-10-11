import { z } from "zod";

export interface InjectState {
  id: string;
  atMinute: number;
  revealed: boolean;
  revealedAt: number | null;
}

export interface DecisionRecord {
  checkpointId: string;
  prompt: string;
  selectedOption: string | null;
  elapsedSeconds: number;
  criteriaConfirmed: Record<string, boolean>;
  decidedBy: string;
  timestamp: number;
}

export interface TimelineEvent {
  minute: number;
  type: "inject" | "decision" | "score" | "checkpoint";
  title: string;
  data?: Record<string, unknown>;
}

export function buildTimeline(
  injects: { id: string; at_minute: number; title: string }[],
  decisions: DecisionRecord[],
  scores: { dimensionKey: string; value: number; timestamp?: number }[]
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const inject of injects) {
    events.push({
      minute: inject.at_minute,
      type: "inject",
      title: inject.title,
      data: { injectId: inject.id },
    });
  }

  for (const decision of decisions) {
    events.push({
      minute: Math.floor(decision.elapsedSeconds / 60),
      type: "decision",
      title: decision.prompt,
      data: { checkpointId: decision.checkpointId, option: decision.selectedOption },
    });
  }

  for (const score of scores) {
    events.push({
      minute: score.timestamp ? Math.floor(score.timestamp / 60) : 0,
      type: "score",
      title: `Score: ${score.dimensionKey}`,
      data: { value: score.value },
    });
  }

  events.sort((a, b) => a.minute - b.minute);
  return events;
}
