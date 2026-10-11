import { PrismaClient } from "@prisma/client";
import { loadAllScenarios, validateScenarioLinks } from "../src/lib/scenarios";
import { loadAllRegulations, validateRegulationRefs } from "../src/lib/regulations";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { load as yamlLoad } from "js-yaml";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log("Loading scenarios...");
  const scenarios = loadAllScenarios();

  for (const [id, scenario] of scenarios) {
    validateScenarioLinks(scenario);
    console.log(`  ✓ ${scenario.id} v${scenario.version} validated`);
  }

  console.log("Loading regulations...");
  const regulations = loadAllRegulations();
  validateRegulationRefs(regulations);

  for (const [id, reg] of regulations) {
    console.log(`  ✓ ${reg.id} loaded (${reg.citations.length} citations)`);
  }

  const sampleDir = join(process.cwd(), "content", "samples");
  const sampleFiles = readdirSync(sampleDir).filter((f) => f.endsWith(".json"));
  console.log(`Found ${sampleFiles.length} sample files`);

  const scenarioList = Array.from(scenarios.values());
  const regulationList = Array.from(regulations.values());
  const sampleList = sampleFiles;

  console.log(`\nSeeded ${scenarioList.length} scenarios, ${regulationList.length} regulation sets, ${sampleList.length} samples`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
