import { NextRequest, NextResponse } from "next/server";
import { parseMcpManifest, parseAgentTools, normalizeEntry } from "@/lib/blastradius/parse";
import { inferCapabilities, inferEgressChannels, inferDataAccess, inferSensitivity } from "@/lib/blastradius/capabilities";
import { NormalizedTool, Capability } from "@/types";
import { z } from "zod";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const source: string = body.source;
    const data: unknown = body.data;

    if (!source || !data) {
      return NextResponse.json({ error: "source and data required" }, { status: 400 });
    }

    if (source === "mcp-manifest") {
      const manifest = parseMcpManifest(data);
      const reviewItems = manifest.tools.map((tool) => {
        const inferredCaps = inferCapabilities(tool.name, tool.description ?? "", tool.annotations);
        const capabilities = [...new Set(inferredCaps.map((c) => c.capability))];
        const sensitivity = inferSensitivity({ name: tool.name, description: tool.description ?? "", capabilities });
        const dataAccess = inferDataAccess({ name: tool.name, description: tool.description ?? "", capabilities });
        const egress = inferEgressChannels({ name: tool.name, description: tool.description ?? "", capabilities, data_access: dataAccess });
        const inferredByRules = inferredCaps.map((c) => ({
          capability: c.capability,
          confidence: c.confidence,
          ruleIndex: c.ruleIndex,
        }));

        return {
          name: tool.name,
          description: tool.description ?? "",
          capabilities,
          sensitivity,
          data_access: dataAccess,
          egress_channels: egress,
          inferred_by: inferredByRules,
        };
      });

      return NextResponse.json({ tools: reviewItems });
    }

    if (source === "langchain") {
      const entries = parseAgentTools(data);
      const reviewItems = entries.map((entry) => {
        const hasCaps = entry.capabilities !== undefined;
        let capabilities: NormalizedTool["capabilities"];
        let sensitivity: NormalizedTool["sensitivity"];
        let dataAccess: string[];
        let egress: string[];

        if (hasCaps) {
          capabilities = entry.capabilities ?? [];
          sensitivity = inferSensitivity({ name: entry.name, description: entry.description ?? "", capabilities });
          dataAccess = entry.data_access ?? [];
          egress = entry.egress_channels ?? [];
        } else {
          const inferredCaps = inferCapabilities(entry.name, entry.description ?? "", undefined);
          capabilities = [...new Set(inferredCaps.map((c) => c.capability))];
          sensitivity = inferSensitivity({ name: entry.name, description: entry.description ?? "", capabilities });
          dataAccess = inferDataAccess({ name: entry.name, description: entry.description ?? "", capabilities });
          egress = inferEgressChannels({ name: entry.name, description: entry.description ?? "", capabilities, data_access: dataAccess });
        }

        const inferredByRules = hasCaps
          ? []
          : inferCapabilities(entry.name, entry.description ?? "", undefined).map((c) => ({
              capability: c.capability,
              confidence: c.confidence,
              ruleIndex: c.ruleIndex,
            }));

        return {
          name: entry.name,
          description: entry.description ?? "",
          capabilities,
          sensitivity,
          data_access: dataAccess,
          egress_channels: egress,
          inferred_by: inferredByRules,
        };
      });

      return NextResponse.json({ tools: reviewItems });
    }

    if (source === "manual") {
      const typedData = data as {
        name: string;
        description: string;
        capabilities: string[];
        data_access: string[];
        egress_channels: string[];
      };
      const tool = normalizeEntry({
        name: typedData.name,
        description: typedData.description,
        capabilities: z.array(Capability).parse(typedData.capabilities),
        data_access: typedData.data_access,
        egress_channels: typedData.egress_channels,
      });
      return NextResponse.json({ tool });
    }

    return NextResponse.json({ error: `Unknown source: ${source}` }, { status: 400 });
  } catch (e) {
    if (e instanceof Error) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
