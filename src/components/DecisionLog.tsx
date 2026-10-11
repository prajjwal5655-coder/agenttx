import { Scenario } from "@/types";

interface DecisionLogProps {
  checkpoints: Scenario["decision_checkpoints"];
  decisions: Array<{
    checkpointId: string;
    selectedOption: string | null;
    elapsedSeconds: number;
    criteriaConfirmed: Record<string, boolean>;
  }>;
  onDecision: (checkpointId: string, option: string, criteriaConfirmed: Record<string, boolean>) => void;
}

export default function DecisionLog({ checkpoints, decisions, onDecision }: DecisionLogProps) {
  return (
    <div className="space-y-4">
      {checkpoints.map((cp) => {
        const decision = decisions.find((d) => d.checkpointId === cp.id);
        const isDecisionMade = decision !== undefined;

        return (
          <div key={cp.id} className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">{cp.prompt}</h3>

            {!isDecisionMade && (
              <div className="space-y-3">
                {cp.options.map((opt, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <input
                      type="radio"
                      id={`opt-${cp.id}-${i}`}
                      name={`decision-${cp.id}`}
                      value={opt}
                      onChange={(e) => {
                        const confirmed: Record<string, boolean> = {};
                        for (const c of cp.objective_criteria) {
                          confirmed[c.key] = c.satisfied_if.length > 0;
                        }
                        onDecision(cp.id, e.target.value, confirmed);
                      }}
                      className="mt-1"
                    />
                    <label htmlFor={`opt-${cp.id}-${i}`} className="text-sm cursor-pointer">
                      {opt}
                    </label>
                  </div>
                ))}

                <div className="mt-3 space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Objective Criteria</h4>
                  {cp.objective_criteria.map((c) => (
                    <div key={c.key} className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        id={c.key}
                        defaultChecked={c.satisfied_if.length > 0}
                        className="mt-0.5"
                      />
                      <label htmlFor={c.key} className="text-sm text-gray-600">
                        {c.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isDecisionMade && (
              <div className="text-sm text-gray-600">
                <p>Selected: <strong>{decision?.selectedOption}</strong></p>
                <p>Time: {Math.floor((decision?.elapsedSeconds ?? 0) / 60)}m {String((decision?.elapsedSeconds ?? 0) % 60).padStart(2, "0")}s</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
