import { describe, it, expect } from "vitest";
import { computeDimensionScore, computeSessionScore, OBJECTIVE_SHARE, FACILITATOR_SHARE } from "../src/lib/scoring";

describe("computeDimensionScore", () => {
  it("returns facilitator score when no criteria linked", () => {
    const result = computeDimensionScore("dim1", [], new Set(), 3);
    expect(result.objectiveRatio).toBe(0);
    expect(result.facilitatorScore).toBe(3);
    expect(result.finalScore).toBe(3);
  });

  it("applies objective ratio when all criteria confirmed", () => {
    const criteria = [{ key: "c1", weight: 1 }];
    const confirmed = new Set(["c1"]);
    const result = computeDimensionScore("dim1", criteria, confirmed, 3);

    expect(result.objectiveRatio).toBe(1.0);
    const expected = Math.round((OBJECTIVE_SHARE * (1 + 4 * 1.0) + FACILITATOR_SHARE * 3) * 10) / 10;
    expect(result.finalScore).toBe(expected);
  });

  it("applies partial objective ratio when some criteria confirmed", () => {
    const criteria = [
      { key: "c1", weight: 0.6 },
      { key: "c2", weight: 0.4 },
    ];
    const confirmed = new Set(["c1"]);
    const result = computeDimensionScore("dim1", criteria, confirmed, 2);

    expect(result.objectiveRatio).toBe(0.6);
    const expected = Math.round((OBJECTIVE_SHARE * (1 + 4 * 0.6) + FACILITATOR_SHARE * 2) * 10) / 10;
    expect(result.finalScore).toBe(expected);
  });

  it("returns facilitator score when zero criteria total weight", () => {
    const criteria: { key: string; weight: number }[] = [];
    const result = computeDimensionScore("dim1", criteria, new Set(), 4);
    expect(result.finalScore).toBe(4);
  });

  it("handles max facilitator score", () => {
    const criteria = [{ key: "c1", weight: 1 }];
    const confirmed = new Set(["c1"]);
    const result = computeDimensionScore("dim1", criteria, confirmed, 5);
    expect(result.finalScore).toBe(5);
  });

  it("handles min facilitator score with no criteria confirmed", () => {
    const criteria = [{ key: "c1", weight: 1 }];
    const confirmed = new Set<string>();
    const result = computeDimensionScore("dim1", criteria, confirmed, 1);
    const expected = Math.round((OBJECTIVE_SHARE * (1 + 4 * 0) + FACILITATOR_SHARE * 1) * 10) / 10;
    expect(result.finalScore).toBe(expected);
  });
});

describe("computeSessionScore", () => {
  it("computes headline score as weighted average", () => {
    const dims = [
      { key: "a", weight: 0.5 },
      { key: "b", weight: 0.5 },
    ];
    const criteriaByDim = new Map([
      ["a", [{ key: "c1", weight: 1 }]],
      ["b", [{ key: "c2", weight: 1 }]],
    ]);
    const confirmed = new Set(["c1"]);
    const scores = new Map([["a", 4], ["b", 2]]);

    const result = computeSessionScore(dims, criteriaByDim, confirmed, scores, []);

    expect(result.dimensions.length).toBe(2);
    const headline = dims.reduce((sum, d) => {
      const dim = result.dimensions.find((x) => x.dimensionKey === d.key)!;
      return sum + d.weight * dim.finalScore;
    }, 0);
    expect(result.headlineScore).toBe(Math.round(headline * 10) / 10);
  });

  it("percentage is 20x score", () => {
    const dims = [{ key: "a", weight: 1.0 }];
    const criteriaByDim = new Map([["a", [{ key: "c1", weight: 1 }]]]);
    const confirmed = new Set<string>();
    const scores = new Map([["a", 3]]);

    const result = computeSessionScore(dims, criteriaByDim, confirmed, scores, []);

    const dimScore = result.dimensions[0].finalScore;
    expect(result.headlinePercentage).toBe(Math.round(dimScore * 20));
  });

  it("includes role scores in output", () => {
    const dims = [{ key: "a", weight: 1.0 }];
    const roleScores = [
      { roleId: "sec_lead", dimensionKey: "a", score: 4, rationale: "Good response" },
    ];
    const result = computeSessionScore(dims, new Map(), new Set(), new Map(), roleScores);
    expect(result.roles.length).toBe(1);
    expect(result.roles[0].roleId).toBe("sec_lead");
  });
});
