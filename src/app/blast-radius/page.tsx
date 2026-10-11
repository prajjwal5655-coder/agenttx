import { useState } from "react";
import dynamic from "next/dynamic";
import { NormalizedTool, Capability } from "@/types";

const BlastGraph = dynamic(() => import("@/components/BlastGraph"), { ssr: false });
const BlastSummary = dynamic(() => import("@/components/BlastSummary"), { ssr: false });
const ToolReview = dynamic(() => import("@/components/ToolReview"), { ssr: false });

type ImportMode = "mcp-manifest" | "langchain" | "manual";

interface ReviewTool {
  name: string;
  description: string;
  capabilities: Capability[];
  sensitivity: NormalizedTool["sensitivity"];
  data_access: string[];
  egress_channels: string[];
  inferred_by: Array<{ capability: Capability; confidence: string; ruleIndex: number }>;
}

export default function BlastRadiusPage() {
  const [step, setStep] = useState<"input" | "review" | "graph">("input");
  const [mode, setMode] = useState<ImportMode>("mcp-manifest");
  const [jsonInput, setJsonInput] = useState("");
  const [reviewTools, setReviewTools] = useState<ReviewTool[]>([]);
  const [confirmedTools, setConfirmedTools] = useState<NormalizedTool[]>([]);

  async function handleImport() {
    try {
      const response = await fetch("/api/blast-radius", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: mode, data: JSON.parse(jsonInput) }),
      });
      const result = await response.json();
      if (!response.ok) {
        alert(`Error: ${result.error}`);
        return;
      }
      if (result.tools) {
        setReviewTools(result.tools);
        setStep("review");
      } else if (result.tool) {
        setConfirmedTools([result.tool]);
        setStep("graph");
      }
    } catch (e) {
      alert(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  function handleConfirm(tools: NormalizedTool[]) {
    setConfirmedTools(tools);
    setStep("graph");
  }

  function handleBackToInput() {
    setStep("input");
    setJsonInput("");
  }

  function handleBackToReview() {
    setStep("review");
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Blast Radius Map
        </h1>
        <p className="text-gray-600 mb-6">
          Import your agent's tool inventory to compute worst-case exposure.
        </p>

        {step === "input" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Import method
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="mode"
                    value="mcp-manifest"
                    checked={mode === "mcp-manifest"}
                    onChange={() => setMode("mcp-manifest")}
                  />
                  <span>MCP manifest (tools/list)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="mode"
                    value="langchain"
                    checked={mode === "langchain"}
                    onChange={() => setMode("langchain")}
                  />
                  <span>Agent tool config JSON</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="mode"
                    value="manual"
                    checked={mode === "manual"}
                    onChange={() => setMode("manual")}
                  />
                  <span>Manual entry</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {mode === "mcp-manifest"
                  ? "Paste MCP manifest JSON (tools/list output):"
                  : mode === "langchain"
                  ? "Paste agent tool config JSON:"
                  : "Manual entry (JSON object):"}
              </label>
              <textarea
                className="w-full h-64 p-3 border border-gray-300 rounded-md font-mono text-sm"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder={
                  mode === "mcp-manifest"
                    ? '{"tools": [{"name": "read_file", "description": "..."}]}'
                    : '[{"name": "read_file", "description": "...", "capabilities": ["fs_read"]}]'
                }
              />
            </div>

            <button
              onClick={handleImport}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Analyze
            </button>
          </div>
        )}

        {step === "review" && (
          <ToolReview
            tools={reviewTools}
            onConfirm={handleConfirm}
            onBack={handleBackToInput}
          />
        )}

        {step === "graph" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <button
                onClick={handleBackToReview}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Back to Review
              </button>
            </div>
            <BlastSummary tools={confirmedTools} />
            <BlastGraph tools={confirmedTools} />
          </div>
        )}
      </div>
    </div>
  );
}
