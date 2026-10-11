import { useState } from "react";
import { NormalizedTool, Capability } from "@/types";
import { CAPABILITY_RULES } from "@/lib/blastradius/capabilities";

interface ToolReviewProps {
  tools: Array<{
    name: string;
    description: string;
    capabilities: Capability[];
    sensitivity: NormalizedTool["sensitivity"];
    data_access: string[];
    egress_channels: string[];
    inferred_by: Array<{ capability: Capability; confidence: string; ruleIndex: number }>;
  }>;
  onConfirm: (tools: NormalizedTool[]) => void;
  onBack: () => void;
}

const capabilityOptions: Capability[] = [
  "fs_read", "fs_write", "net_http", "net_https", "exec_shell", "exec_code",
  "creds_read", "db_read", "db_write", "payment", "messaging", "email",
  "calendar", "admin_iam", "cloud_infra", "browser_control",
];

const sensitivityOptions: NormalizedTool["sensitivity"][] = ["public", "internal", "confidential", "regulated"];

export default function ToolReview({ tools, onConfirm, onBack }: ToolReviewProps) {
  const [editedTools, setEditedTools] = useState(tools);

  function toggleCapability(toolIndex: number, cap: Capability) {
    const newTools = [...editedTools];
    const tool = { ...newTools[toolIndex] };
    if (tool.capabilities.includes(cap)) {
      tool.capabilities = tool.capabilities.filter((c) => c !== cap);
    } else {
      tool.capabilities = [...tool.capabilities, cap];
    }
    newTools[toolIndex] = tool;
    setEditedTools(newTools);
  }

  function updateField(toolIndex: number, field: "description" | "sensitivity", value: string) {
    const newTools = [...editedTools];
    newTools[toolIndex] = { ...newTools[toolIndex], [field]: value };
    setEditedTools(newTools);
  }

  function updateArrayField(toolIndex: number, field: "data_access" | "egress_channels", value: string) {
    const items = value.split(",").map((s) => s.trim()).filter(Boolean);
    const newTools = [...editedTools];
    newTools[toolIndex] = { ...newTools[toolIndex], [field]: items };
    setEditedTools(newTools);
  }

  function handleConfirm() {
    const normalized: NormalizedTool[] = editedTools.map((t) => ({
      name: t.name,
      description: t.description,
      capabilities: t.capabilities,
      sensitivity: t.sensitivity as NormalizedTool["sensitivity"],
      data_access: t.data_access,
      egress_channels: t.egress_channels,
    }));
    onConfirm(normalized);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Review Inferred Tool Capabilities</h2>
        <button
          onClick={onBack}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
        >
          Back
        </button>
      </div>

      <p className="text-sm text-gray-600">
        Review each tool's inferred capabilities. The graph will be built from confirmed values only.
      </p>

      {editedTools.map((tool, i) => (
        <div key={tool.name} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="font-medium text-lg mb-2">{tool.name}</h3>

          {(tool.inferred_by.length > 0 || tool.inferred_by === undefined) && (
            <div className="mb-2 text-xs text-gray-500">
              {tool.inferred_by.length > 0 && (
                <p>
                  Inferred by rules: {tool.inferred_by.map((r) => {
                    const rule = CAPABILITY_RULES[r.ruleIndex];
                    return `${r.capability} (rule: ${rule?.pattern}, confidence: ${r.confidence})`;
                  }).join("; ")}
                </p>
              )}
            </div>
          )}

          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={tool.description}
              onChange={(e) => updateField(i, "description", e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>

          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Sensitivity</label>
            <select
              value={tool.sensitivity}
              onChange={(e) => updateField(i, "sensitivity", e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              {sensitivityOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Capabilities</label>
            <div className="flex flex-wrap gap-2">
              {capabilityOptions.map((cap) => (
                <label key={cap} className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={tool.capabilities.includes(cap)}
                    onChange={() => toggleCapability(i, cap)}
                  />
                  {cap}
                </label>
              ))}
            </div>
          </div>

          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Access (comma-separated labels)
            </label>
            <input
              type="text"
              value={tool.data_access.join(", ")}
              onChange={(e) => updateArrayField(i, "data_access", e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="e.g. customer-db, /srv/reports"
            />
          </div>

          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Egress Channels (comma-separated labels)
            </label>
            <input
              type="text"
              value={tool.egress_channels.join(", ")}
              onChange={(e) => updateArrayField(i, "egress_channels", e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="e.g. email, https, slack"
            />
          </div>
        </div>
      ))}

      <div className="flex justify-end gap-2">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Back
        </button>
        <button
          onClick={handleConfirm}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Build Graph
        </button>
      </div>
    </div>
  );
}
