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

export type Scenario = {
  id: string;
  title: string;
  version: string;
  duration_minutes: number;
  target_audience: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  learning_objectives: string[];
  based_on: {
    incident_class: string;
    public_sources: Array<{
      title: string;
      publisher: string;
      year: number;
      url?: string | null;
      verified: boolean;
    }>;
    adaptation_note: string;
  };
  example_inventory: unknown[];
  roles: Array<{
    id: string;
    name: string;
    remit: string;
    private_brief: string;
    pressure: string;
    win_conditions: string[];
  }>;
  injects: Array<{
    id: string;
    at_minute: number;
    channel: Channel;
    title: string;
    body: string;
    artifacts: string[];
  }>;
  decision_checkpoints: Array<{
    id: string;
    prompt: string;
    options: string[];
    objective_criteria: Array<{
      key: string;
      label: string;
      dimension_key: string;
      target_minutes?: number;
      satisfied_if: string;
      auto: boolean;
      weight: number;
    }>;
  }>;
  scoring_dimensions: Array<{
    key: string;
    label: string;
    weight: number;
    description: string;
    what_good_looks_like: string;
    common_failure_modes: string[];
  }>;
  recommendations: Array<{
    gap: string;
    severity: "low" | "med" | "high" | "critical";
    remediation: string;
    owner_role: string;
    regulation_refs: string[];
  }>;
  facilitator_notes: string;
  debrief_talking_points: string[];
  disclaimers: string[];
};
