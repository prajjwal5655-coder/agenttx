import { z } from "zod";
import { NormalizedToolSchema, NormalizedTool, Capability, Sensitivity } from "../../types";

export const MCPManifestToolSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  inputSchema: z.any().optional(),
  annotations: z
    .object({
      readOnlyHint: z.boolean().optional(),
      destructiveHint: z.boolean().optional(),
      openWorldHint: z.boolean().optional(),
    })
    .optional(),
});

export const MCPManifestSchema = z.object({
  tools: MCPManifestToolSchema.array(),
});

export type MCPManifest = z.infer<typeof MCPManifestSchema>;

export const AgentToolsEntrySchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  capabilities: Capability.array().optional(),
  data_access: z.string().array().optional(),
  egress_channels: z.string().array().optional(),
});

export type AgentToolsEntry = z.infer<typeof AgentToolsEntrySchema>;

export function parseMcpManifest(json: unknown): MCPManifest {
  return MCPManifestSchema.parse(json);
}

export function parseAgentTools(json: unknown): AgentToolsEntry[] {
  return AgentToolsEntrySchema.array().parse(json);
}

export function mcpManifestToReviewItems(manifest: MCPManifest): Array<{
  name: string;
  description: string;
  hasCapabilities: false;
  annotations: { readOnlyHint?: boolean; destructiveHint?: boolean; openWorldHint?: boolean } | undefined;
}> {
  return manifest.tools.map((tool) => ({
    name: tool.name,
    description: tool.description ?? "",
    hasCapabilities: false as const,
    annotations: tool.annotations,
  }));
}

export function agentToolsToReviewItems(entries: AgentToolsEntry[]): Array<{
  name: string;
  description: string;
  hasCapabilities: boolean;
  capabilities?: z.infer<typeof Capability>[];
  dataAccess?: string[];
  egressChannels?: string[];
}> {
  return entries.map((entry) => ({
    name: entry.name,
    description: entry.description ?? "",
    hasCapabilities: entry.capabilities !== undefined && entry.data_access !== undefined,
    capabilities: entry.capabilities,
    dataAccess: entry.data_access,
    egressChannels: entry.egress_channels,
  }));
}

export function manualToEntry(name: string, description: string, capabilities: string[], dataAccess: string[], egressChannels: string[]): AgentToolsEntry {
  const parsedCaps = z.array(Capability).parse(capabilities);
  const parsedSens = Sensitivity.array().parse([]);
  return {
    name,
    description,
    capabilities: parsedCaps,
    data_access: dataAccess,
    egress_channels: egressChannels,
  };
}

export function normalizeEntry(entry: AgentToolsEntry): NormalizedTool {
  const parsedCaps = z.array(Capability).parse(entry.capabilities ?? []);
  return {
    name: entry.name,
    description: entry.description ?? "",
    capabilities: parsedCaps,
    sensitivity: "internal",
    data_access: entry.data_access ?? [],
    egress_channels: entry.egress_channels ?? [],
  };
}
