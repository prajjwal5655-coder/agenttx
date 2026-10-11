import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewSessionPage() {
  const router = useRouter();
  const [scenarios, setScenarios] = useState<{ id: string; title: string; version: string }[]>([]);
  const [facilitator, setFacilitator] = useState("");
  const [scenarioId, setScenarioId] = useState("");

  useEffect(() => {
    fetch("/api/sessions/scenarios")
      .then((r) => r.json())
      .then((data) => setScenarios(data.scenarios))
      .catch(() => {});
  }, []);

  async function createSession() {
    if (!facilitator || !scenarioId) {
      alert("Facilitator and scenario required");
      return;
    }

    const response = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ facilitator, scenarioId }),
    });
    const result = await response.json();
    if (!response.ok) {
      alert(`Error: ${result.error}`);
      return;
    }
    router.push(`/sessions/${result.id}`);
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">New Session</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Facilitator Name
            </label>
            <input
              type="text"
              value={facilitator}
              onChange={(e) => setFacilitator(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Jane Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scenario
            </label>
            <select
              value={scenarioId}
              onChange={(e) => setScenarioId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Select a scenario</option>
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} (v{s.version})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            onClick={createSession}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Start Session
          </button>
          <button
            onClick={() => router.push("/sessions")}
            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
