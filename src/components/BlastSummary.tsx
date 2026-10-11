import { NormalizedTool } from "@/types";
import { buildGraphWithCaps, summarize, worstCaseReachability, egressPaths } from "@/lib/blastradius/graph";

interface BlastSummaryProps {
  tools: NormalizedTool[];
}

export default function BlastSummary({ tools }: BlastSummaryProps) {
  if (tools.length === 0) {
    return (
      <div className="p-6 bg-gray-100 rounded-lg">
        <p className="text-gray-500">Add tools to see the blast radius summary.</p>
      </div>
    );
  }

  const graph = buildGraphWithCaps(tools);
  const summary = summarize(graph);
  const reach = worstCaseReachability(graph);
  const paths = egressPaths(graph);

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Blast Radius Summary</h2>

      <div className="mb-4">
        <p className="text-gray-800 font-medium">{summary.description}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
        <div className="p-3 bg-red-50 rounded">
          <div className="text-2xl font-bold text-red-700">{reach.datastoresReadable.length}</div>
          <div className="text-sm text-gray-600">Datastores Readable</div>
        </div>
        <div className="p-3 bg-orange-50 rounded">
          <div className="text-2xl font-bold text-orange-700">{reach.datastoresWritable.length}</div>
          <div className="text-sm text-gray-600">Datastores Writable</div>
        </div>
        <div className="p-3 bg-red-50 rounded">
          <div className="text-2xl font-bold text-red-700">{reach.execShells.length}</div>
          <div className="text-sm text-gray-600">Exec Surfaces</div>
        </div>
        <div className="p-3 bg-red-50 rounded">
          <div className="text-2xl font-bold text-red-700">{reach.credentialStores.length}</div>
          <div className="text-sm text-gray-600">Credential Stores</div>
        </div>
        <div className="p-3 bg-red-50 rounded">
          <div className="text-2xl font-bold text-red-700">{reach.outboundChannels.length}</div>
          <div className="text-sm text-gray-600">Outbound Channels</div>
        </div>
      </div>

      {paths.length > 0 && (
        <div className="mb-4">
          <h3 className="font-medium text-gray-800 mb-2">Egress Paths (highlighted in graph)</h3>
          <div className="space-y-2">
            {paths.map((path, i) => (
              <div key={i} className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                <span className="font-medium">{path.datastore}</span>
                {" -> "}
                <span>{path.readTool}</span>
                {" -> "}
                <span className="text-red-700 font-medium">Agent (compromised)</span>
                {" -> "}
                <span>{path.egressTool}</span>
                {" -> "}
                <span className="text-red-700 font-medium">{path.external}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={async () => {
            const graph = buildGraphWithCaps(tools);
            const data = JSON.stringify(graph, null, 2);
            const blob = new Blob([data], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "blast-radius-graph.json";
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
        >
          Export JSON
        </button>
      </div>
    </div>
  );
}
