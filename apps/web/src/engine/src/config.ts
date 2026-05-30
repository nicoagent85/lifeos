import { GameState, ScenarioKey } from './state';

export const ACTION_POINTS_PER_WEEK = 5;
export const SKILL_COST = 50000; // $500
export const CASH_FLOOR = -50000; // -$500

export const WAGE_BY_TIER = {
  'GIG': 15000, 
  'ENTRY': 30000,
  'SKILLED': 60000,
  'SENIOR': 100000
} as const;

export const PROMOTION_SKILL_THRESHOLDS = {
  'GIG': 30, // to ENTRY
  'ENTRY': 60, // to SKILLED
  'SKILLED': 90 // to SENIOR
} as const;

export function getStartingState(scenario: ScenarioKey, seed: number): GameState {
  const baseState: GameState = {
    scenario,
    seed,
    turnIndex: 0,
    status: 'ACTIVE',
    cash: 0,
    boostTokens: 0,
    incomeWeekly: 0,
    expensesWeekly: 0,
    health: 100,
    stress: 0,
    happiness: 100,
    actionPoints: ACTION_POINTS_PER_WEEK,
    reputation: 50,
    jobTier: 'GIG',
    skills: { workSkill: 10, lifeSkill: 10 },
    flags: {},
    ledger: []
  };

  switch (scenario) {
    case 'BROKE_YOUNG_ADULT':
      return {
        ...baseState,
        cash: 50000, // $500
        expensesWeekly: 30000, // $300 a week for rent/food/bills
        jobTier: 'GIG',
        skills: { workSkill: 10, lifeSkill: 10 }
      };
    case 'LAID_OFF':
      return {
        ...baseState,
        cash: 300000, // $3000
        expensesWeekly: 50000, // $500 a week
        jobTier: 'SKILLED',
        skills: { workSkill: 50, lifeSkill: 30 }
      };
    case 'STUDENT':
      return {
        ...baseState,
        cash: 10000, // $100
        expensesWeekly: 15000, // $150 a week
        jobTier: 'GIG',
        skills: { workSkill: 20, lifeSkill: 5 }
      };
  }
}

export const HEALTH_INCOME_MULTIPLIERS = {
  80: 1.1,
  50: 1.0,
  0: 0.9
};

export const STRESS_INCOME_PENALTY = {
  threshold: 80,
  multiplier: 0.7,
  severeThreshold: 95,
  severeMultiplier: 0.5
};

export const STRESS_HEALTH_DECAY = {
  threshold: 70,
  perTurn: 6,
  severeThreshold: 90,
  severePerTurn: 12
};

export const LIFESTYLE_CREEP_ON_PROMOTION = 0.20; // +20% expenses per promotion

export const HEALTH_MEDICAL_RISK = {
  30: { weightTarget: 30, costMultiplierTarget: 2.0 },
  60: { weightTarget: 15, costMultiplierTarget: 1.5 },
  100: { weightTarget: 10, costMultiplierTarget: 1.0 }
};
