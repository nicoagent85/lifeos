import { GameState, ScenarioKey } from './state.js';

export const ACTION_POINTS_PER_WEEK = 5;
export const SKILL_COST = 50000; // $500
export const CASH_FLOOR = -50000; // -$500

export const WAGE_BY_TIER = {
  'GIG': 10000, // $100 per action point spent
  'ENTRY': 20000,
  'SKILLED': 40000,
  'SENIOR': 80000
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
