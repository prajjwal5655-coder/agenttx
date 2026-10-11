import { BlastGraph, BlastSummary, GraphEdge, GraphNode, NormalizedTool, Capability } from "../../types";

export function buildGraph(tools: NormalizedTool[]): BlastGraph {
  const nodes: GraphNode[] = [{ id: "agent", type: "agent", label: "Agent (compromised)" }];
  const edges: GraphEdge[] = [];
  const datastoreSet = new Set<string>();
  const externalSet = new Set<string>();
  const toolNodeIds = new Set<string>();

  for (const tool of tools) {
    const toolId = `tool_${tool.name}`;
    if (!toolNodeIds.has(toolId)) {
      nodes.push({ id: toolId, type: "tool", label: tool.name });
      toolNodeIds.add(toolId);
    }
    edges.push({ source: "agent", target: toolId, label: "invokes" });

    for (const da of tool.data_access) {
      if (!datastoreSet.has(da)) {
        datastoreSet.add(da);
        nodes.push({ id: `ds_${da}`, type: "datastore", label: da });
      }
      const isWriteCap = tool.capabilities.includes("fs_write") || tool.capabilities.includes("db_write");
      const edgeLabel = isWriteCap ? "write" : "read";
      edges.push({ source: toolId, target: `ds_${da}`, label: edgeLabel as "read" | "write" });
    }

    for (const ch of tool.egress_channels) {
      if (!externalSet.has(ch)) {
        externalSet.add(ch);
        nodes.push({ id: `ext_${ch}`, type: "external", label: ch });
      }
      edges.push({ source: toolId, target: `ext_${ch}`, label: "egress" });
    }
  }

  return { nodes, edges };
}

export function buildGraphWithCaps(tools: NormalizedTool[]): BlastGraph & { toolCapabilities: Map<string, Capability[]> } {
  const graph = buildGraph(tools);
  const toolCapabilities = new Map<string, Capability[]>();

  for (const tool of tools) {
    const toolId = `tool_${tool.name}`;
    toolCapabilities.set(toolId, tool.capabilities);
  }

  return { ...graph, toolCapabilities };
}

export function worstCaseReachability(graph: BlastGraph & { toolCapabilities?: Map<string, Capability[]> }): {
  datastoresReadable: string[];
  datastoresWritable: string[];
  execShells: string[];
  credentialStores: string[];
  outboundChannels: string[];
} {
  const datastoresReadable: string[] = [];
  const datastoresWritable: string[] = [];
  const execShells: string[] = [];
  const credentialStores: string[] = [];
  const outboundChannels: string[] = [];

  for (const node of graph.nodes) {
    if (node.type === "datastore") {
      const hasRead = graph.edges.some((e) => e.target === node.id && e.label === "read");
      const hasWrite = graph.edges.some((e) => e.target === node.id && e.label === "write");
      if (hasRead) datastoresReadable.push(node.label);
      if (hasWrite) datastoresWritable.push(node.label);
    }
    if (node.type === "tool") {
      const caps = graph.toolCapabilities?.get(node.id) ?? [];
      if (caps.includes("exec_shell") || caps.includes("exec_code")) {
        execShells.push(node.label);
      }
      if (caps.includes("creds_read")) {
        credentialStores.push(node.label);
      }
    }
    if (node.type === "external") {
      outboundChannels.push(node.label);
    }
  }

  return {
    datastoresReadable: [...new Set(datastoresReadable)],
    datastoresWritable: [...new Set(datastoresWritable)],
    execShells: [...new Set(execShells)],
    credentialStores: [...new Set(credentialStores)],
    outboundChannels: [...new Set(outboundChannels)],
  };
}

export function egressPaths(graph: BlastGraph & { toolCapabilities?: Map<string, Capability[]> }): Array<{
  datastore: string;
  readTool: string;
  egressTool: string;
  external: string;
}> {
  const paths: Array<{ datastore: string; readTool: string; egressTool: string; external: string }> = [];

  const datastoreNodes = graph.nodes.filter((n) => n.type === "datastore");
  const toolNodes = graph.nodes.filter((n) => n.type === "tool");
  const externalNodes = graph.nodes.filter((n) => n.type === "external");

  for (const ds of datastoreNodes) {
    const readEdges = graph.edges.filter((e) => e.target === ds.id && e.label === "read");

    for (const readEdge of readEdges) {
      const readToolId = readEdge.source;
      const readToolName = toolNodes.find((t) => t.id === readToolId)?.label || readToolId;

      const egressEdges = graph.edges.filter((e) => e.source === readToolId && e.label === "egress");

      for (const egressEdge of egressEdges) {
        const externalId = egressEdge.target;
        const extNode = externalNodes.find((n) => n.id === externalId);
        if (extNode) {
          paths.push({
            datastore: ds.label,
            readTool: readToolName,
            egressTool: readToolName,
            external: extNode.label,
          });
        }
      }
    }
  }

  const unique: typeof paths = [];
  const seen = new Set<string>();
  for (const p of paths) {
    const key = `${p.datastore}|${p.readTool}|${p.external}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(p);
    }
  }

  return unique;
}

export function summarize(graph: BlastGraph & { toolCapabilities?: Map<string, Capability[]> }): BlastSummary {
  const reach = worstCaseReachability(graph);

  const execCount = reach.execShells.length > 0 ? 1 : 0;
  const credCount = reach.credentialStores.length;
  const egressCount = reach.outboundChannels.length;

  const parts: string[] = [];
  parts.push(`If hijacked: ${reach.datastoresReadable.length} datastores readable, ${reach.datastoresWritable.length} writable, ${execCount} shell execution, ${credCount} credential stores, ${egressCount} outbound channels (${reach.outboundChannels.join(", ")})`);

  return {
    readableDatastores: reach.datastoresReadable.length,
    writableDatastores: reach.datastoresWritable.length,
    execSurfaces: execCount,
    credentialStores: credCount,
    outboundChannels: egressCount,
    description: parts.join(", "),
  };
}
