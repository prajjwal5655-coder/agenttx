import { describe, it, expect } from "vitest";
import { loadAllScenarios, loadScenario, validateScenarioLinks } from "../src/lib/scenarios";
import { loadAllRegulations, loadRegulation } from "../src/lib/regulations";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

describe("M0: Scenario loading + validation", () => {
  it("loads all 3 scenarios", () => {
    const scenarios = loadAllScenarios();
    expect(scenarios.size).toBe(3);
    expect(scenarios.has("helpful-plugin")).toBe(true);
    expect(scenarios.has("scope-creep")).toBe(true);
    expect(scenarios.has("silent-exfiltration")).toBe(true);
  });

  it("validates all scenarios pass Zod + cross-ref checks", () => {
    const scenarios = loadAllScenarios();
    for (const [id, scenario] of scenarios) {
      expect(() => validateScenarioLinks(scenario)).not.toThrow();
    }
  });

  it("each scenario has correct role count (4-6)", () => {
    const scenarios = loadAllScenarios();
    for (const [id, scenario] of scenarios) {
      expect(scenario.roles.length).toBeGreaterThanOrEqual(4);
      expect(scenario.roles.length).toBeLessThanOrEqual(6);
    }
  });

  it("each scenario has correct inject count (8-12)", () => {
    const scenarios = loadAllScenarios();
    for (const [id, scenario] of scenarios) {
      expect(scenario.injects.length).toBeGreaterThanOrEqual(8);
      expect(scenario.injects.length).toBeLessThanOrEqual(12);
    }
  });

  it("each scenario has correct checkpoint count (3-4)", () => {
    const scenarios = loadAllScenarios();
    for (const [id, scenario] of scenarios) {
      expect(scenario.decision_checkpoints.length).toBeGreaterThanOrEqual(3);
      expect(scenario.decision_checkpoints.length).toBeLessThanOrEqual(4);
    }
  });

  it("each scenario has correct scoring dimension count (5-6)", () => {
    const scenarios = loadAllScenarios();
    for (const [id, scenario] of scenarios) {
      expect(scenario.scoring_dimensions.length).toBeGreaterThanOrEqual(5);
      expect(scenario.scoring_dimensions.length).toBeLessThanOrEqual(6);
    }
  });

  it("dimension weights sum to 1.0", () => {
    const scenarios = loadAllScenarios();
    for (const [id, scenario] of scenarios) {
      const sum = scenario.scoring_dimensions.reduce((acc, d) => acc + d.weight, 0);
      expect(Math.abs(sum - 1.0)).toBeLessThan(0.0001);
    }
  });

  it("every criterion's dimension_key exists", () => {
    const scenarios = loadAllScenarios();
    for (const [id, scenario] of scenarios) {
      const dimKeys = new Set(scenario.scoring_dimensions.map((d) => d.key));
      for (const checkpoint of scenario.decision_checkpoints) {
        for (const c of checkpoint.objective_criteria) {
          expect(dimKeys.has(c.dimension_key)).toBe(true);
        }
      }
    }
  });

  it("every inject at_minute <= duration_minutes", () => {
    const scenarios = loadAllScenarios();
    for (const [id, scenario] of scenarios) {
      for (const inject of scenario.injects) {
        expect(inject.at_minute).toBeLessThanOrEqual(scenario.duration_minutes);
      }
    }
  });

  it("all ids are unique within each scenario", () => {
    const scenarios = loadAllScenarios();
    for (const [id, scenario] of scenarios) {
      const injectIds = scenario.injects.map((i) => i.id);
      const checkpointIds = scenario.decision_checkpoints.map((c) => c.id);
      const roleIds = scenario.roles.map((r) => r.id);

      expect(new Set(injectIds).size).toBe(injectIds.length);
      expect(new Set(checkpointIds).size).toBe(checkpointIds.length);
      expect(new Set(roleIds).size).toBe(roleIds.length);
    }
  });
});

describe("M0: Regulation loading + validation", () => {
  it("loads all 3 regulation sets", () => {
    const regulations = loadAllRegulations();
    expect(regulations.size).toBe(3);
    expect(regulations.has("eu-ai-act")).toBe(true);
    expect(regulations.has("sec-cyber-disclosure")).toBe(true);
    expect(regulations.has("dora")).toBe(true);
  });

  it("all citations have verified: false", () => {
    const regulations = loadAllRegulations();
    for (const [id, reg] of regulations) {
      for (const c of reg.citations) {
        expect(c.verified).toBe(false);
      }
    }
  });

  it("each regulation has at least 1 citation", () => {
    const regulations = loadAllRegulations();
    for (const [id, reg] of regulations) {
      expect(reg.citations.length).toBeGreaterThan(0);
    }
  });
});

describe("M0: Sample files exist and are valid JSON", () => {
  it("loads mcp-manifest.json", () => {
    const path = join(process.cwd(), "content", "samples", "mcp-manifest.json");
    const content = readFileSync(path, "utf8");
    const parsed = JSON.parse(content);
    expect(parsed.tools).toBeDefined();
    expect(Array.isArray(parsed.tools)).toBe(true);
  });

  it("loads agent-tools.json", () => {
    const path = join(process.cwd(), "content", "samples", "agent-tools.json");
    const content = readFileSync(path, "utf8");
    const parsed = JSON.parse(content);
    expect(Array.isArray(parsed)).toBe(true);
  });
});

describe("M0: Legal disclaimer exists", () => {
  it("loads disclaimer.md", () => {
    const path = join(process.cwd(), "content", "legal", "disclaimer.md");
    const content = readFileSync(path, "utf8");
    expect(content.length).toBeGreaterThan(100);
  });
});
