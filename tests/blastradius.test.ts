import { describe, it, expect } from "vitest";
import { CAPABILITY_RULES, inferCapabilities, inferEgressChannels, inferDataAccess, inferSensitivity } from "../src/lib/blastradius/capabilities";
import { buildGraphWithCaps, worstCaseReachability, egressPaths, summarize } from "../src/lib/blastradius/graph";
import { NormalizedTool } from "../src/types";

function makeTool(
  name: string,
  description: string,
  capabilities: NormalizedTool["capabilities"],
  dataAccess: string[] = [],
  egress: string[] = []
): NormalizedTool {
  return {
    name,
    description,
    capabilities,
    sensitivity: "internal",
    data_access: dataAccess,
    egress_channels: egress,
  };
}

describe("Capabilities inference", () => {
  it("infers fs_read from keyword", () => {
    const results = inferCapabilities("read_file", "Read files from filesystem", undefined);
    expect(results.some((r) => r.capability === "fs_read")).toBe(true);
  });

  it("infers exec_shell from keyword", () => {
    const results = inferCapabilities("run_command", "Execute a shell command on the host", undefined);
    expect(results.some((r) => r.capability === "exec_shell")).toBe(true);
  });

  it("infers db_read from keyword", () => {
    const results = inferCapabilities("query_db", "Query a database for records", undefined);
    expect(results.some((r) => r.capability === "db_read")).toBe(true);
  });

  it("infers email from keyword", () => {
    const results = inferCapabilities("send_email", "Send an email notification via SMTP", undefined);
    expect(results.some((r) => r.capability === "email")).toBe(true);
  });

  it("infers creds_read from keyword", () => {
    const results = inferCapabilities("read_secret", "Read secrets from the secret store", undefined);
    expect(results.some((r) => r.capability === "creds_read")).toBe(true);
  });

  it("infers net_https from keyword", () => {
    const results = inferCapabilities("fetch_data", "Make an HTTPS request to external API", undefined);
    expect(results.some((r) => r.capability === "net_https")).toBe(true);
  });

  it("infers admin_iam from keyword", () => {
    const results = inferCapabilities("manage_users", "Create and delete IAM users and roles", undefined);
    expect(results.some((r) => r.capability === "admin_iam")).toBe(true);
  });

  it("infers cloud_infra from keyword", () => {
    const results = inferCapabilities("aws_read", "Read AWS S3 and EC2 resources", undefined);
    expect(results.some((r) => r.capability === "cloud_infra")).toBe(true);
  });

  it("infers browser_control from keyword", () => {
    const results = inferCapabilities("browser_click", "Click a button in the browser", undefined);
    expect(results.some((r) => r.capability === "browser_control")).toBe(true);
  });

  it("infers payment from keyword", () => {
    const results = inferCapabilities("charge_card", "Process a payment via Stripe", undefined);
    expect(results.some((r) => r.capability === "payment")).toBe(true);
  });

  it("no false positives for unrelated tool", () => {
    const results = inferCapabilities("calculate_sum", "Add two numbers together", undefined);
    expect(results.length).toBe(0);
  });

  it("rules contain no AI", () => {
    expect(CAPABILITY_RULES.length).toBeGreaterThan(0);
    for (const rule of CAPABILITY_RULES) {
      expect(typeof rule.pattern).toBe("string");
      expect(typeof rule.capability).toBe("string");
      expect(["high", "medium", "low"]).toContain(rule.confidence);
    }
  });

  it("infers egress channels from capabilities", () => {
    const tool = makeTool("send_email", "Send email", ["email"], ["customer-db"], []);
    const egress = inferEgressChannels(tool);
    expect(egress).toContain("email");
  });

  it("infers egress channels from net_https", () => {
    const tool = makeTool("fetch_api", "Fetch API data", ["net_https"], ["customer-db"], []);
    const egress = inferEgressChannels(tool);
    expect(egress).toContain("https");
  });

  it("infers data access labels", () => {
    const tool = makeTool("query_db", "Query customer database", ["db_read"], [], []);
    const da = inferDataAccess(tool);
    expect(da).toContain("customer-db");
  });

  it("infers sensitivity as regulated for creds_read", () => {
    const tool = makeTool("read_secret", "Read secret", ["creds_read"], [], []);
    expect(inferSensitivity(tool)).toBe("regulated");
  });

  it("infers sensitivity as confidential for exec_shell", () => {
    const tool = makeTool("run_command", "Run shell", ["exec_shell"], [], []);
    expect(inferSensitivity(tool)).toBe("confidential");
  });
});

describe("Graph building", () => {
  it("builds correct nodes from tools", () => {
    const tools: NormalizedTool[] = [
      makeTool("read_db", "Read database", ["db_read"], ["customer-db"], []),
      makeTool("send_email", "Send email", ["email"], [], ["email"]),
    ];

    const graph = buildGraphWithCaps(tools);

    const agentNode = graph.nodes.find((n) => n.type === "agent");
    expect(agentNode).toBeDefined();
    expect(agentNode?.id).toBe("agent");

    const toolNodes = graph.nodes.filter((n) => n.type === "tool");
    expect(toolNodes.length).toBe(2);

    const dsNodes = graph.nodes.filter((n) => n.type === "datastore");
    expect(dsNodes.length).toBe(1);
    expect(dsNodes[0].label).toBe("customer-db");

    const extNodes = graph.nodes.filter((n) => n.type === "external");
    expect(extNodes.length).toBe(1);
    expect(extNodes[0].label).toBe("email");
  });

  it("builds correct edges", () => {
    const tools: NormalizedTool[] = [
      makeTool("read_db", "Read database", ["db_read"], ["customer-db"], []),
    ];

    const graph = buildGraphWithCaps(tools);

    const invokeEdges = graph.edges.filter((e) => e.label === "invokes");
    expect(invokeEdges.length).toBe(1);
    expect(invokeEdges[0].source).toBe("agent");

    const readEdges = graph.edges.filter((e) => e.label === "read");
    expect(readEdges.length).toBe(1);
    expect(readEdges[0].source).toBe("tool_read_db");
    expect(readEdges[0].target).toBe("ds_customer-db");
  });

  it("deduplicates datastores and externals across tools", () => {
    const tools: NormalizedTool[] = [
      makeTool("read_db", "Read database", ["db_read"], ["customer-db"], ["email"]),
      makeTool("read_db2", "Read database again", ["db_read"], ["customer-db"], ["email"]),
    ];

    const graph = buildGraphWithCaps(tools);

    const dsNodes = graph.nodes.filter((n) => n.type === "datastore");
    expect(dsNodes.length).toBe(1);

    const extNodes = graph.nodes.filter((n) => n.type === "external");
    expect(extNodes.length).toBe(1);
  });

  it("labels edges as write when db_write or fs_write capability present", () => {
    const tools: NormalizedTool[] = [
      makeTool("write_db", "Write database", ["db_write"], ["customer-db"], []),
    ];

    const graph = buildGraphWithCaps(tools);

    const writeEdges = graph.edges.filter((e) => e.label === "write");
    expect(writeEdges.length).toBe(1);
  });
});

describe("Worst case reachability", () => {
  it("finds all readable datastores", () => {
    const tools: NormalizedTool[] = [
      makeTool("read_db1", "Read db1", ["db_read"], ["customer-db"], []),
      makeTool("read_db2", "Read db2", ["db_read"], ["sales-db"], []),
    ];

    const graph = buildGraphWithCaps(tools);
    const reach = worstCaseReachability(graph);

    expect(reach.datastoresReadable).toHaveLength(2);
    expect(reach.datastoresReadable).toContain("customer-db");
    expect(reach.datastoresReadable).toContain("sales-db");
  });

  it("finds all writable datastores", () => {
    const tools: NormalizedTool[] = [
      makeTool("write_db", "Write db", ["db_write"], ["customer-db"], []),
    ];

    const graph = buildGraphWithCaps(tools);
    const reach = worstCaseReachability(graph);

    expect(reach.datastoresWritable).toContain("customer-db");
  });

  it("finds exec shells", () => {
    const tools: NormalizedTool[] = [
      makeTool("shell", "Execute shell", ["exec_shell"], [], []),
      makeTool("code", "Execute code", ["exec_code"], [], []),
    ];

    const graph = buildGraphWithCaps(tools);
    const reach = worstCaseReachability(graph);

    expect(reach.execShells.length).toBeGreaterThan(0);
  });

  it("finds credential stores", () => {
    const tools: NormalizedTool[] = [
      makeTool("read_secret", "Read secret", ["creds_read"], ["secrets-vault"], []),
    ];

    const graph = buildGraphWithCaps(tools);
    const reach = worstCaseReachability(graph);

    expect(reach.credentialStores).toContain("read_secret");
  });

  it("finds outbound channels", () => {
    const tools: NormalizedTool[] = [
      makeTool("email", "Send email", ["email"], [], ["email"]),
      makeTool("http", "HTTP request", ["net_http"], [], ["http"]),
    ];

    const graph = buildGraphWithCaps(tools);
    const reach = worstCaseReachability(graph);

    expect(reach.outboundChannels).toContain("email");
    expect(reach.outboundChannels).toContain("http");
  });
});

describe("Egress paths", () => {
  it("finds path: datastore -> readTool -> egress -> external", () => {
    const tools: NormalizedTool[] = [
      makeTool("query_data", "Read customer db and email it", ["db_read", "email"], ["customer-db"], ["email"]),
    ];

    const graph = buildGraphWithCaps(tools);
    const paths = egressPaths(graph);

    expect(paths.length).toBeGreaterThan(0);
    expect(paths[0].datastore).toBe("customer-db");
    expect(paths[0].readTool).toBe("query_data");
    expect(paths[0].external).toBe("email");
  });

  it("returns empty when no egress-capable tool exists", () => {
    const tools: NormalizedTool[] = [
      makeTool("read_db", "Read database", ["db_read"], ["customer-db"], []),
    ];

    const graph = buildGraphWithCaps(tools);
    const paths = egressPaths(graph);

    expect(paths.length).toBe(0);
  });

  it("finds separate read and egress tools in same chain", () => {
    const tools: NormalizedTool[] = [
      makeTool("read_db", "Read database", ["db_read"], ["customer-db"], []),
      makeTool("exfil", "Read db and email it", ["db_read", "email"], ["customer-db"], ["email"]),
    ];

    const graph = buildGraphWithCaps(tools);
    const paths = egressPaths(graph);

    expect(paths.length).toBeGreaterThan(0);
  });

  it("deduplicates egress paths", () => {
    const tools: NormalizedTool[] = [
      makeTool("tool_a", "Read db and email", ["db_read", "email"], ["customer-db"], ["email"]),
      makeTool("tool_b", "Read db and email", ["db_read", "email"], ["customer-db"], ["email"]),
    ];

    const graph = buildGraphWithCaps(tools);
    const paths = egressPaths(graph);

    const uniqueKeys = new Set(paths.map((p) => `${p.datastore}|${p.readTool}|${p.external}`));
    expect(uniqueKeys.size).toBe(paths.length);
  });
});

describe("Summarize", () => {
  it("produces human-readable blast radius", () => {
    const tools: NormalizedTool[] = [
      makeTool("read_db", "Read customer db", ["db_read"], ["customer-db"], ["email"]),
      makeTool("shell", "Execute shell", ["exec_shell"], ["/etc"], ["https"]),
      makeTool("read_secret", "Read secrets", ["creds_read"], ["secrets-vault"], []),
    ];

    const graph = buildGraphWithCaps(tools);
    const summary = summarize(graph);

    expect(summary.readableDatastores).toBe(3);
    expect(summary.outboundChannels).toBe(2);
    expect(summary.description).toContain("datastores readable");
    expect(summary.description).toContain("email");
    expect(summary.description).toContain("https");
  });

  it("reports zero exec surfaces when no exec tools", () => {
    const tools: NormalizedTool[] = [
      makeTool("read_db", "Read db", ["db_read"], ["customer-db"], []),
    ];

    const graph = buildGraphWithCaps(tools);
    const summary = summarize(graph);

    expect(summary.execSurfaces).toBe(0);
  });
});
