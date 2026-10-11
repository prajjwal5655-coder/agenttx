import { NormalizedTool, Capability, Scenario } from "@/types";

interface InjectCardProps {
  inject: Scenario["injects"][number];
  isActive: boolean;
  onReveal: () => void;
}

export default function InjectCard({ inject, isActive, onReveal }: InjectCardProps) {
  return (
    <div className={`border rounded-lg p-4 mb-4 ${isActive ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"}`}>
      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs text-gray-500">[{inject.channel}] at {inject.at_minute}m</span>
          <h3 className="font-semibold text-lg">{inject.title}</h3>
          <pre className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{inject.body}</pre>
        </div>
        {isActive && (
          <button
            onClick={onReveal}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
          >
            Mark Revealed
          </button>
        )}
      </div>
    </div>
  );
}
