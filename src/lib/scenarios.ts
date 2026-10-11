import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { load as yamlLoad } from "js-yaml";
import { z } from "zod";
import { ScenarioSchema } from "./zod/scenarios";

export type Scenario = z.infer<typeof ScenarioSchema>;

const scenariosDir = join(process.cwd(), "content", "scenarios");

function parseYaml(filePath: string): unknown {
  const content = readFileSync(filePath, "utf8");
  try {
    return yamlLoad(content);
  } catch (e) {
    throw new Error(`${filePath}: failed to parse YAML - ${e instanceof Error ? e.message : String(e)}`);
  }
}

export function loadScenario(id: string): Scenario {
  const filePath = join(scenariosDir, `${id}.yaml`);
  try {
    const parsed = parseYaml(filePath);
    return ScenarioSchema.parse(parsed);
  } catch (e) {
    if (e instanceof z.ZodError) {
      const issues = e.issues.map((i) => `  - ${i.path.join(".") || "root"}: ${i.message}`).join("\n");
      throw new Error(`${filePath}: validation failed:\n${issues}`);
    }
    throw e;
  }
}

export function loadAllScenarios(): Map<string, Scenario> {
  const files = readdirSync(scenariosDir).filter((f) => f.endsWith(".yaml"));
  const result = new Map<string, Scenario>();

  for (const file of files) {
    const id = file.replace(".yaml", "");
    const scenario = loadScenario(id);
    result.set(scenario.id, scenario);
  }

  return result;
}

export function validateScenarioLinks(scenario: Scenario): void {
  const dimKeys = new Set(scenario.scoring_dimensions.map((d) => d.key));
  const checkIds = new Set<string>();
  const injectIds = new Set<string>();

  for (const checkpoint of scenario.decision_checkpoints) {
    if (checkIds.has(checkpoint.id)) {
      throw new Error(`Scenario ${scenario.id}: duplicate checkpoint id "${checkpoint.id}"`);
    }
    checkIds.add(checkpoint.id);
  }

  for (const inject of scenario.injects) {
    if (injectIds.has(inject.id)) {
      throw new Error(`Scenario ${scenario.id}: duplicate inject id "${inject.id}"`);
    }
    injectIds.add(inject.id);
  }

  for (const checkpoint of scenario.decision_checkpoints) {
    for (const c of checkpoint.objective_criteria) {
      if (!dimKeys.has(c.dimension_key)) {
        throw new Error(
          `Scenario ${scenario.id}: criterion "${c.key}" references unknown dimension "${c.dimension_key}"`
        );
      }
    }
  }

  for (const inject of scenario.injects) {
    if (inject.at_minute > scenario.duration_minutes) {
      throw new Error(
        `Scenario ${scenario.id}: inject "${inject.id}" at_minute ${inject.at_minute} exceeds duration ${scenario.duration_minutes}`
      );
    }
  }

  const weightSum = scenario.scoring_dimensions.reduce((sum, d) => sum + d.weight, 0);
  if (Math.abs(weightSum - 1.0) > 0.0001) {
    throw new Error(`Scenario ${scenario.id}: scoring_dimension weights sum to ${weightSum}, expected 1.0`);
  }
}
