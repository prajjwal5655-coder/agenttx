import { z } from "zod";

export const PublicSourceSchema = z.object({
  title: z.string(),
  publisher: z.string(),
  year: z.number().int(),
  url: z.string().url().nullish(),
  verified: z.boolean(),
});

export const BasedOnSchema = z.object({
  incident_class: z.string(),
  public_sources: PublicSourceSchema.array(),
  adaptation_note: z.string(),
});

export const RoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  remit: z.string(),
  private_brief: z.string(),
  pressure: z.string(),
  win_conditions: z.string().array(),
});

export const InjectSchema = z.object({
  id: z.string(),
  at_minute: z.number().int().nonnegative(),
  channel: z.enum(["email", "slack", "dashboard", "phone", "alert"]),
  title: z.string(),
  body: z.string(),
  artifacts: z.string().array().optional().default([]),
});

export const ObjectiveCriteriaSchema = z.object({
  key: z.string(),
  label: z.string(),
  dimension_key: z.string(),
  target_minutes: z.number().int().positive().optional(),
  satisfied_if: z.string(),
  auto: z.boolean().default(false),
  weight: z.number().min(0).max(1),
});

export const DecisionCheckpointSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  options: z.string().array(),
  objective_criteria: ObjectiveCriteriaSchema.array(),
});

export const ScoringDimensionSchema = z.object({
  key: z.string(),
  label: z.string(),
  weight: z.number().min(0).max(1),
  description: z.string(),
  what_good_looks_like: z.string(),
  common_failure_modes: z.string().array(),
});

export const RecommendationSchema = z.object({
  gap: z.string(),
  severity: z.enum(["low", "med", "high", "critical"]),
  remediation: z.string(),
  owner_role: z.string(),
  regulation_refs: z.string().array(),
});

export const ScenarioSchema = z.object({
  id: z.string(),
  title: z.string(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  duration_minutes: z.number().int().positive(),
  target_audience: z.string(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  learning_objectives: z.string().array(),
  based_on: BasedOnSchema,
  example_inventory: z.any().array(),
  roles: RoleSchema.array(),
  injects: InjectSchema.array(),
  decision_checkpoints: DecisionCheckpointSchema.array(),
  scoring_dimensions: ScoringDimensionSchema.array(),
  recommendations: RecommendationSchema.array(),
  facilitator_notes: z.string(),
  debrief_talking_points: z.string().array(),
  disclaimers: z.string().array(),
});
