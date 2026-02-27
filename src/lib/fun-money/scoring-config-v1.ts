/**
 * Scoring Rules Config V1 — LS-Math-v1.0
 * Formal configuration matching the PPLP spec YAML exactly.
 * 
 * This config is the single source of truth for all scoring parameters.
 * Any change to scoring logic MUST be versioned here first.
 */

export const SCORING_RULES_V1 = {
  rule_version: 'LS-Math-v1.0',

  weights: {
    base_action_weight: 0.4,
    content_weight: 0.6,
  },

  reputation: {
    alpha: 0.25,
    w_min: 0.5,
    w_max: 2.0,
  },

  content: {
    gamma: 1.3,
    type_multiplier: {
      post: 1.0,
      comment: 0.6,
      video: 1.2,
      course: 1.5,
      bug_report: 1.1,
      proposal: 1.3,
    } as Record<string, number>,
  },

  consistency: {
    beta: 0.6,
    lambda: 30,
  },

  sequence: {
    eta: 0.5,
    kappa: 5,
  },

  penalty: {
    theta: 0.8,
    max_penalty: 0.5,
  },

  mint: {
    epoch_type: 'monthly' as const,
    anti_whale_cap: 0.03,
    min_light_threshold: 10,
  },

  levels: {
    seed: 0,
    sprout: 50,
    builder: 200,
    guardian: 500,
    architect: 1200,
  },
} as const;

/** Type for the scoring rules config */
export type ScoringRulesV1 = typeof SCORING_RULES_V1;
