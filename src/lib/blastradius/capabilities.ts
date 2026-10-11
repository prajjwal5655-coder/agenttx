import { Capability, NormalizedTool } from "../../types";
import { CapabilityRule, InferCapabilityResult } from "../../types";
import { z } from "zod";

export const CAPABILITY_RULES: CapabilityRule[] = [
  { pattern: "read.*file|list.*dir|file.*read|fs_read|stat|directory|path.*exist", capability: "fs_read", confidence: "high" },
  { pattern: "write.*file|create.*file|file.*write|fs_write|append.*file", capability: "fs_write", confidence: "high" },
  { pattern: "delete.*file|rm |remove.*file|unlink", capability: "fs_write", confidence: "high" },
  { pattern: "exec.*shell|shell.*exec|run.*command|execute.*command|exec_shell|run_command", capability: "exec_shell", confidence: "high" },
  { pattern: "eval.*code|exec.*code|run.*script|exec_code|run_python|run_js|python|node.*script", capability: "exec_code", confidence: "high" },
  { pattern: "http.*request|http_get|http_post|fetch.*url|net_http|curl.*http|request.*http", capability: "net_http", confidence: "high" },
  { pattern: "https|secure.*http|tls|net_https|fetch.*https|api.*call", capability: "net_https", confidence: "high" },
  { pattern: "query.*db|database.*read|sql.*select|db_read|read.*database|query.*table", capability: "db_read", confidence: "high" },
  { pattern: "insert.*db|update.*db|delete.*db|write.*database|db_write|sql.*insert|sql.*update", capability: "db_write", confidence: "high" },
  { pattern: "secret.*read|read.*secret|secret.*get|get.*secret|credential.*read|creds_read|vault.*read|fetch.*secret", capability: "creds_read", confidence: "high" },
  { pattern: "payment|charge.*card|process.*payment|stripe|payment.*intent|payment_intent", capability: "payment", confidence: "high" },
  { pattern: "send.*email|email.*send|smtp|send.*mail|email.*to|outlook.*send|gmail.*send|mail.*api|email", capability: "email", confidence: "high" },
  { pattern: "slack|discord|teams|chat.*send|send.*chat|messaging|webhook.*send", capability: "messaging", confidence: "high" },
  { pattern: "calendar|schedule.*event|google.*calendar|calendar.*event|outlook.*calendar", capability: "calendar", confidence: "high" },
  { pattern: "iam|user.*create|user.*delete|admin.*user|role.*assign|policy.*attach|admin_iam|iam.*role|permission.*grant", capability: "admin_iam", confidence: "high" },
  { pattern: "aws|s3|ec2|lambda|cloud.*resource|cloud_infra|cloud.*api|gcp.*api|azure.*resource", capability: "cloud_infra", confidence: "high" },
  { pattern: "browser.*control|browser.*click|browser.*navigate|browser_control|playwright|puppeteer|clicks?.*button", capability: "browser_control", confidence: "high" },
  { pattern: "read.*cred|get.*token|auth.*token|access.*token|list.*key|api.*key|read.*api", capability: "creds_read", confidence: "medium" },
  { pattern: "read.*config|config.*read|read.*setting|setting.*read|read.*env|env.*var", capability: "fs_read", confidence: "medium" },
  { pattern: "read.*doc|document.*read|doc.*read|fetch.*doc|docs.*read|knowledge.*base", capability: "net_http", confidence: "medium" },
  { pattern: "update.*ticket|ticket.*update|status.*update|update.*status", capability: "db_write", confidence: "medium" },
  { pattern: "generate.*report|report.*generate|create.*report|summary.*generate|generate.*summary", capability: "db_read", confidence: "medium" },
  { pattern: "list.*ticket|ticket.*list|fetch.*ticket|get.*ticket", capability: "db_read", confidence: "medium" },
  { pattern: "notify|alert|broadcast|push.*notification", capability: "messaging", confidence: "medium" },
  { pattern: "upload|download.*file|file.*download|transfer.*file", capability: "fs_write", confidence: "medium" },
  { pattern: "store.*in|drive.*store|store.*drive|file.*store", capability: "fs_write", confidence: "low" },
  { pattern: "debug|debug.*shell|shell.*debug|troubleshoot|debug.*tool", capability: "exec_shell", confidence: "low" },
];

export const EGRESS_CAPABILITIES: Set<string> = new Set([
  "net_http",
  "net_https",
  "email",
  "messaging",
  "browser_control",
  "payment",
]);

export function inferCapabilities(
  name: string,
  description: string,
  annotations: { readOnlyHint?: boolean; destructiveHint?: boolean; openWorldHint?: boolean } | undefined
): InferCapabilityResult[] {
  const text = `${name} ${description || ""}`.toLowerCase();
  const results: Array<{ capability: z.infer<typeof Capability>; confidence: "high" | "medium" | "low"; ruleIndex: number }> = [];

  for (let i = 0; i < CAPABILITY_RULES.length; i++) {
    const rule = CAPABILITY_RULES[i];
    const regex = new RegExp(rule.pattern, "i");
    if (regex.test(text)) {
      results.push({
        capability: rule.capability,
        confidence: rule.confidence,
        ruleIndex: i,
      });
    }
  }

  return results;
}

export function inferSensitivity(tool: Partial<NormalizedTool>): "public" | "internal" | "confidential" | "regulated" {
  const caps = tool.capabilities || [];

  if (caps.includes("creds_read") || caps.includes("db_read") || caps.includes("payment")) {
    return "regulated";
  }
  if (caps.includes("exec_shell") || caps.includes("exec_code") || caps.includes("admin_iam") || caps.includes("cloud_infra")) {
    return "confidential";
  }
  if (caps.length > 0) {
    return "internal";
  }
  return "public";
}

export function inferDataAccess(tool: Partial<NormalizedTool>): string[] {
  const text = `${tool.name || ""} ${tool.description || ""}`.toLowerCase();
  const labels: string[] = [];

  if (text.includes("customer") || text.includes("user")) {
    labels.push("customer-db");
  }
  if (text.includes("secret") || text.includes("vault") || text.includes("credential")) {
    labels.push("secrets-vault");
  }
  if (text.includes("support") || text.includes("ticket")) {
    labels.push("support-db");
  }
  if (text.includes("sales") || text.includes("order")) {
    labels.push("sales-db");
  }
  if (text.includes("file") || text.includes("document") || text.includes("doc")) {
    labels.push("/shared/reports");
  }

  return labels;
}

export function inferEgressChannels(tool: Partial<NormalizedTool>): string[] {
  const caps = tool.capabilities || [];
  const channels: string[] = [];

  for (const cap of caps) {
    if (cap === "net_http") {
      if (!channels.includes("http")) channels.push("http");
    }
    if (cap === "net_https") {
      if (!channels.includes("https")) channels.push("https");
    }
    if (cap === "email") {
      if (!channels.includes("email")) channels.push("email");
    }
    if (cap === "messaging") {
      if (!channels.includes("slack")) channels.push("slack");
    }
    if (cap === "browser_control") {
      if (!channels.includes("https")) channels.push("https");
    }
    if (cap === "payment") {
      if (!channels.includes("https")) channels.push("https");
    }
  }

  return channels;
}

export function inferFromAnnotations(
  name: string,
  description: string,
  annotations: { readOnlyHint?: boolean; destructiveHint?: boolean; openWorldHint?: boolean } | undefined
): InferCapabilityResult[] {
  return inferCapabilities(name, description, annotations);
}
