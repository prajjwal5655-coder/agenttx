import { z } from "zod";

export const Capability = z.enum([
  "fs_read",
  "fs_write",
  "net_http",
  "net_https",
  "exec_shell",
  "exec_code",
  "creds_read",
  "db_read",
  "db_write",
  "payment",
  "messaging",
  "email",
  "calendar",
  "admin_iam",
  "cloud_infra",
  "browser_control",
]);

export type Capability = z.infer<typeof Capability>;

export const Sensitivity = z.enum(["public", "internal", "confidential", "regulated"]);
export type Sensitivity = z.infer<typeof Sensitivity>;

export const NormalizedToolSchema = z.object({
  name: z.string(),
  description: z.string(),
  capabilities: Capability.array(),
  sensitivity: Sensitivity,
  data_access: z.string().array(),
  egress_channels: z.string().array(),
});

export type NormalizedTool = z.infer<typeof NormalizedToolSchema>;

export type GraphNode = {
  id: string;
  type: "agent" | "tool" | "datastore" | "external";
  label: string;
};

export type GraphEdge = {
  source: string;
  target: string;
  label: "invokes" | "read" | "write" | "egress";
};

export type BlastGraph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type BlastSummary = {
  readableDatastores: number;
  writableDatastores: number;
  execSurfaces: number;
  credentialStores: number;
  outboundChannels: number;
  description: string;
};

export type CapabilityRule = {
  pattern: string;
  capability: Capability;
  confidence: "high" | "medium" | "low";
};

export type InferCapabilityResult = {
  capability: Capability;
  confidence: "high" | "medium" | "low";
  ruleIndex: number;
};

export type Channel = "email" | "slack" | "dashboard" | "phone" | "alert";
