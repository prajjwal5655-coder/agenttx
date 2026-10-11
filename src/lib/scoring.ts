import { z } from "zod";

export const OBJECTIVE_SHARE = 0.7;
export const FACILITATOR_SHARE = 0.3;

export interface CriterionConfirmation {
  criterionKey: string;
  confirmed: boolean;
}

export interface DimensionScore {
  dimensionKey: string;
  objectiveRatio: number;
  facilitatorScore: number;
  finalScore: number;
}

export interface RoleScore {
  roleId: string;
  dimensionKey: string;
  score: number;
  rationale: string;
}

export interface SessionScore {
  dimensions: DimensionScore[];
  roles: RoleScore[];
  headlineScore: number;
  headlinePercentage: number;
}

export function computeDimensionScore(
  dimensionKey: string,
  criteriaWeights: { key: string; weight: number }[],
  confirmedCriteria: Set<string>,
  facilitatorScore: number
): DimensionScore {
  const totalWeight = criteriaWeights.reduce((sum, c) => sum + c.weight, 0);
  const confirmedWeight = criteriaWeights.filter((c) => confirmedCriteria.has(c.key)).reduce((sum, c) => sum + c.weight, 0);
  const r = totalWeight > 0 ? confirmedWeight / totalWeight : 0;

  const final = totalWeight > 0
    ? Math.round((OBJECTIVE_SHARE * (1 + 4 * r) + FACILITATOR_SHARE * facilitatorScore) * 10) / 10
    : facilitatorScore;

  return {
    dimensionKey,
    objectiveRatio: r,
    facilitatorScore,
    finalScore: final,
  };
}

export function computeSessionScore(
  dimensionWeights: { key: string; weight: number }[],
  criteriaByDimension: Map<string, { key: string; weight: number }[]>,
  confirmedCriteria: Set<string>,
  dimensionScores: Map<string, number>,
  roleScores: RoleScore[]
): SessionScore {
  const dimensions: DimensionScore[] = [];

  for (const dim of dimensionWeights) {
    const criteria = criteriaByDimension.get(dim.key) ?? [];
    const facScore = dimensionScores.get(dim.key) ?? 3;
    const dimScore = computeDimensionScore(dim.key, criteria, confirmedCriteria, facScore);
    dimensions.push(dimScore);
  }

  const headlineScore = dimensionWeights.reduce((sum, dim) => {
    const dimScore = dimensions.find((d) => d.dimensionKey === dim.key);
    const weighted = dim.weight * (dimScore?.finalScore ?? 0);
    return sum + weighted;
  }, 0);

  return {
    dimensions,
    roles: roleScores,
    headlineScore: Math.round(headlineScore * 10) / 10,
    headlinePercentage: Math.round(headlineScore * 20),
  };
}
