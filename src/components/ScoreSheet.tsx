import { Scenario } from "@/types";

interface ScoreSheetProps {
  dimensions: Scenario["scoring_dimensions"];
  scores: Record<string, number>;
  onScore: (dimensionKey: string, value: number) => void;
}

export default function ScoreSheet({ dimensions, scores, onScore }: ScoreSheetProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-800 mb-2">Score Sheet</h3>
      {dimensions.map((dim) => (
        <div key={dim.key} className="border border-gray-200 rounded-lg p-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">{dim.label}</label>
          <p className="text-xs text-gray-500 mb-2">{dim.description}</p>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={5}
              value={scores[dim.key] ?? 3}
              onChange={(e) => onScore(dim.key, Number(e.target.value))}
              className="w-32"
            />
            <span className="text-lg font-bold">{scores[dim.key] ?? 3}/5</span>
          </div>
          <div className="mt-2">
            <textarea
              placeholder="Rationale..."
              onChange={(e) => {}}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              rows={2}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
