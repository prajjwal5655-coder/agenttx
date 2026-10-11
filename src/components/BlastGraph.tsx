import { NormalizedTool, Capability } from "@/types";
import { CAPABILITY_RULES, inferCapabilities } from "@/lib/blastradius/capabilities";
import { CapabilityRule } from "@/types";

interface BlastGraphProps {
  tools: NormalizedTool[];
}

const capabilityLabels: Record<Capability, string> = {
  fs_read: "Filesystem Read",
  fs_write: "Filesystem Write",
  net_http: "HTTP Request",
  net_https: "HTTPS Request",
  exec_shell: "Shell Execution",
  exec_code: "Code Execution",
  creds_read: "Credential Read",
  db_read: "Database Read",
  db_write: "Database Write",
  payment: "Payment Processing",
  messaging: "Messaging",
  email: "Email",
  calendar: "Calendar",
  admin_iam: "IAM Admin",
  cloud_infra: "Cloud Infrastructure",
  browser_control: "Browser Control",
};

export default function BlastGraph({ tools }: BlastGraphProps) {
  if (tools.length === 0) {
    return (
      <div className="p-6 bg-gray-100 rounded-lg border border-gray-200">
        <p className="text-gray-500">No tools configured. Add tools to visualize the graph.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Blast Radius Graph</h2>

      <div className="mb-4 text-sm text-gray-600">
        Interactive graph rendered with React Flow will appear here.
        Egress paths are highlighted in red.
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left p-2">Tool</th>
              <th className="text-left p-2">Capabilities</th>
              <th className="text-left p-2">Data Access</th>
              <th className="text-left p-2">Egress Channels</th>
            </tr>
          </thead>
          <tbody>
            {tools.map((tool) => (
              <tr key={tool.name} className="border-b">
                <td className="p-2 font-medium">{tool.name}</td>
                <td className="p-2">
                  {tool.capabilities.map((c) => capabilityLabels[c] || c).join(", ") || "(none)"}
                </td>
                <td className="p-2">{tool.data_access.join(", ") || "(none)"}</td>
                <td className="p-2">{tool.egress_channels.join(", ") || "(none)"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h3 className="font-medium text-gray-800 mb-2">Legend</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Agent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Tool</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span>Datastore</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="font-medium">External (egress)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
