import { GameState, ScenarioKey, Venture, VentureType } from './state.js';

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


export const ASSET_CATALOG = [
  { id: 'used_car', name: 'Used Car', category: 'TRANSPORT', cost: 500000, effects: { eventBadWeightMultiplier: 0.8, statusValue: 300000 } },
  { id: 'reliable_car', name: 'Reliable Car', category: 'TRANSPORT', cost: 1500000, effects: { eventBadWeightMultiplier: 0.5, statusValue: 1000000 }, requires: ['used_car'] },
  { id: 'studio_apt', name: 'Studio Apartment', category: 'HOUSING', cost: 2000000, effects: { expensesWeeklyDelta: -10000, statusValue: 2000000 } },
  { id: 'starter_home', name: 'Starter Home', category: 'HOUSING', cost: 5000000, effects: { expensesWeeklyDelta: -20000, statusValue: 5000000 }, requires: ['studio_apt'] },
  { id: 'family_home', name: 'Family Home', category: 'HOUSING', cost: 15000000, effects: { expensesWeeklyDelta: -30000, statusValue: 15000000 }, requires: ['starter_home'] },
  { id: 'luxury_home', name: 'Luxury Home', category: 'HOUSING', cost: 50000000, effects: { expensesWeeklyDelta: -50000, statusValue: 50000000 }, requires: ['family_home'] },
  { id: 'weekend_trip', name: 'Weekend Trip', category: 'LEISURE', cost: 100000, effects: { happinessPerTurn: 2, statusValue: 0 } },
  { id: 'world_vacation', name: 'World Vacation', category: 'LEISURE', cost: 500000, effects: { happinessPerTurn: 5, statusValue: 0 }, requires: ['weekend_trip'] },
  { id: 'home_gym', name: 'Home Gym', category: 'LIFESTYLE', cost: 300000, effects: { stressPerTurnDelta: -2, statusValue: 150000 } }
];

export const BUSINESS_TIER_COSTS = {
  'SIDE_BUSINESS': 200000,
  'BUSINESS': 1000000,
  'ENTERPRISE': 5000000
};

export const BUSINESS_INCOME_BY_TIER = {
  'NONE': 0,
  'SIDE_BUSINESS': 20000,
  'BUSINESS': 100000,
  'ENTERPRISE': 500000
};

export const BUSINESS_EQUITY_BY_TIER = {
  'NONE': 0,
  'SIDE_BUSINESS': 1000000,
  'BUSINESS': 5000000,
  'ENTERPRISE': 20000000
};

export const BUSINESS_SKILL_REQ = {
  'NONE': { skill: 110, cost: 200000, next: 'SIDE_BUSINESS' },
  'SIDE_BUSINESS': { skill: 160, cost: 1000000, next: 'BUSINESS' },
  'BUSINESS': { skill: 220, cost: 5000000, next: 'ENTERPRISE' }
};

export const MILESTONES = [
  { id: 'first_10k', name: 'First $10k net worth', test: (state: any) => getNetWorth(state) >= 1000000 },
  { id: 'buy_home', name: 'Buy your first home', test: (state: any) => (state.assets || []).includes('studio_apt') || (state.assets || []).includes('starter_home') || (state.assets || []).includes('family_home') || (state.assets || []).includes('luxury_home') },
  { id: 'reach_senior', name: 'Reach SENIOR', test: (state: any) => state.jobTier === 'SENIOR' },
  { id: 'start_business', name: 'Start a business', test: (state: any) => (state.businessTier && state.businessTier !== 'NONE') },
  { id: 'six_figures', name: 'Six figures ($100k)', test: (state: any) => getNetWorth(state) >= 10000000 },
  { id: 'build_enterprise', name: 'Build an enterprise', test: (state: any) => state.businessTier === 'ENTERPRISE' },
  { id: 'millionaire', name: 'Millionaire ($1M net worth)', test: (state: any) => getNetWorth(state) >= 100000000 }
];

export function getNetWorth(state: any): number {
  let nw = state.cash;
  const assetsStr = state.assets || [];
  for (const a of assetsStr) {
    const asset = ASSET_CATALOG.find(cat => cat.id === a);
    if (asset && asset.effects && asset.effects.statusValue) {
      nw += asset.effects.statusValue;
    }
  }
  const bt = state.businessTier || 'NONE';
  if (bt in BUSINESS_EQUITY_BY_TIER) {
    nw += (BUSINESS_EQUITY_BY_TIER as any)[bt];
  }
  // Venture equity (Slice 11)
  const ventures = (state as any).ventures as Venture[] | undefined;
  if (Array.isArray(ventures)) {
    for (const v of ventures) nw += getVentureEquity(v);
  }
  return nw;
}

export function getMilestones(state: any) {
  return MILESTONES.map(m => ({ id: m.id, name: m.name, done: m.test(state) }));
}

// ===== Phase B / Slice 10: Life stages + dynamic action capacity =====

export type LifeStage = 'EARLY' | 'ESTABLISHING' | 'PEAK' | 'LATE';

// Coarse life stage from how far into the run you are. Kept simple + deterministic.
// (Position-aware refinements come with career/venture slices.)
export function getLifeStage(state: GameState): LifeStage {
  const t = state.turnIndex;
  if (t < 26) return 'EARLY';        // ~first 6 months: lots of free time, volatile
  if (t < 78) return 'ESTABLISHING'; // building career/ventures
  if (t < 156) return 'PEAK';        // most obligations
  return 'LATE';                     // settled
}

// How many ventures/obligations the player is actively running (each eats time unless delegated).
// Backward compatible: legacy businessTier counts as 1 hands-on obligation if not NONE.
// `delegatedObligations` (optional) frees that many AP at an income cost handled elsewhere.
export function getObligationCount(state: GameState): number {
  let n = 0;
  const ventures = (state as any).ventures as { delegated?: boolean }[] | undefined;
  if (Array.isArray(ventures)) {
    n += ventures.filter(v => !v.delegated).length;
  } else if (state.businessTier && state.businessTier !== 'NONE') {
    n += (state as any).businessDelegated ? 0 : 1;
  }
  return n;
}

export const AP_BASE = 5;
export const AP_MIN = 3;
export const AP_MAX = 9;

export interface CapacityBreakdown {
  base: number;
  wellbeing: number;   // +1 thriving, -1 struggling
  lifeStage: number;   // +1 early freedom, -1..-2 peak obligations
  obligations: number; // -1 per active (non-delegated) venture/business
  perks: number;       // +AP from assets/upgrades
  total: number;       // clamped AP_MIN..AP_MAX
}

// Single source of truth for weekly action capacity. Engine AND UI must call this.
export function getActionCapacity(state: GameState): CapacityBreakdown {
  const base = AP_BASE;

  let wellbeing = 0;
  if (state.health >= 80 && state.stress <= 30) wellbeing += 1; // thriving
  if (state.health < 35 || state.stress >= 80) wellbeing -= 1;  // falling apart

  const stage = getLifeStage(state);
  let lifeStage = 0;
  if (stage === 'EARLY') lifeStage = 1;        // young & free
  else if (stage === 'ESTABLISHING') lifeStage = 0;
  else if (stage === 'PEAK') lifeStage = -1;   // most committed
  else lifeStage = 0;                          // LATE: settled

  const obligations = -getObligationCount(state);

  // Perk AP from owned assets (future assets can grant +AP, e.g. personal assistant).
  let perks = 0;
  const assets = state.assets || [];
  for (const aId of assets) {
    const def = ASSET_CATALOG.find(c => c.id === aId) as any;
    if (def?.effects?.actionPointDelta) perks += def.effects.actionPointDelta;
  }

  const raw = base + wellbeing + lifeStage + obligations + perks;
  const total = Math.max(AP_MIN, Math.min(AP_MAX, raw));
  return { base, wellbeing, lifeStage, obligations, perks, total };
}

// ===== Phase B / Slice 11: Business v2 — ventures portfolio =====
// (Venture / VentureType types live in state.ts to avoid circular deps.)

// baseRate = weekly income (cents) at exactly CAPITAL_UNIT capital, level 1, neutral reputation.
export const CAPITAL_UNIT = 500000; // $5,000 reference capital

export const VENTURE_DEFS: Record<VentureType, {
  name: string;
  baseRate: number;      // cents/wk at 1 unit capital
  minWorkSkill: number;  // to found
  minCapital: number;    // founding cost (cents)
  equityMult: number;    // net-worth value per cent of capital
  heatPerWeek: number;   // grey accrues exposure
  volatility: number;    // 0..1, used by risk engine (Slice 12)
  blurb: string;
}> = {
  FREELANCE:   { name: 'Freelance Gig',   baseRate: 8000,  minWorkSkill: 40,  minCapital: 50000,   equityMult: 0.5, heatPerWeek: 0, volatility: 0.10, blurb: 'Low risk, low ceiling. A safe side income.' },
  LOCAL_BIZ:   { name: 'Local Business',  baseRate: 18000, minWorkSkill: 90,  minCapital: 300000,  equityMult: 1.0, heatPerWeek: 0, volatility: 0.20, blurb: 'A real shop. Scales with your reputation.' },
  STARTUP:     { name: 'Startup',         baseRate: 35000, minWorkSkill: 140, minCapital: 1000000, equityMult: 1.5, heatPerWeek: 0, volatility: 0.45, blurb: 'High reward, high variance. Can boom or bust.' },
  GREY_MARKET: { name: 'Grey-Market Op',  baseRate: 60000, minWorkSkill: 110, minCapital: 500000,  equityMult: 0.8, heatPerWeek: 6, volatility: 0.60, blurb: 'Fat profits, rising heat. One bust can wipe it — and stain your name.' },
};

// Reputation multiplier: a known operator earns more.
export function repMultiplier(state: GameState): number {
  return 1 + Math.max(0, state.reputation) / 200; // rep 100 -> +50%
}

// Diminishing returns on capital: income ~ sqrt(capital/unit).
export function getVentureIncome(v: Venture, state: GameState): number {
  const def = VENTURE_DEFS[v.type];
  const capFactor = Math.sqrt(Math.max(0, v.capital) / CAPITAL_UNIT);
  const levelMult = 1 + (v.level - 1) * 0.35;
  let income = def.baseRate * capFactor * repMultiplier(state) * levelMult;
  if (v.delegated) income *= 0.6; // manager's cut (mirrors legacy delegate)
  return Math.floor(income);
}

export function getVentureEquity(v: Venture): number {
  return Math.floor(v.capital * VENTURE_DEFS[v.type].equityMult);
}

let __ventureSeq = 0;
export function makeVentureId(state: GameState): string {
  __ventureSeq += 1;
  return `v${state.turnIndex}-${(state.ventures?.length ?? 0)}-${__ventureSeq}`;
}
