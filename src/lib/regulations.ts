import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { load as yamlLoad } from "js-yaml";
import { z } from "zod";
import { RegulationSchema } from "./zod/regulations";

export type Regulation = z.infer<typeof RegulationSchema>;

const regulationsDir = join(process.cwd(), "content", "regulations");

export function loadRegulation(id: string): Regulation {
  const filePath = join(regulationsDir, `${id}.yaml`);
  const content = readFileSync(filePath, "utf8");
  let parsed: unknown;
  try {
    parsed = yamlLoad(content);
  } catch (e) {
    throw new Error(`${filePath}: failed to parse YAML - ${e instanceof Error ? e.message : String(e)}`);
  }
  try {
    return RegulationSchema.parse(parsed);
  } catch (e) {
    if (e instanceof z.ZodError) {
      const issues = e.issues.map((i) => `  - ${i.path.join(".") || "root"}: ${i.message}`).join("\n");
      throw new Error(`${filePath}: validation failed:\n${issues}`);
    }
    throw e;
  }
}

export function loadAllRegulations(): Map<string, Regulation> {
  const files = readdirSync(regulationsDir).filter((f) => f.endsWith(".yaml"));
  const result = new Map<string, Regulation>();

  for (const file of files) {
    const id = file.replace(".yaml", "");
    const regulation = loadRegulation(id);
    result.set(regulation.id, regulation);
  }

  return result;
}

export function validateRegulationRefs(regulations: Map<string, Regulation>): void {
  const allRefs = new Set<string>();
  for (const reg of regulations.values()) {
    for (const c of reg.citations) {
      allRefs.add(c.ref);
    }
  }
  return;
}
