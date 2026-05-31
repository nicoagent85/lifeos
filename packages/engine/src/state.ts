export type Currency = 'CASH' | 'BOOST_TOKEN';

export type ReasonCode = 'ASSET_PURCHASE' | 'BUSINESS_INVEST' | 'BUSINESS_INCOME' | 'WAGE' | 'SIDE_GIG' | 'RENT' | 'FOOD' | 'BILLS' | 'EVENT_COST' | 'EVENT_WINDFALL' | 'WELLBEING';

export interface LedgerEntry {
  id: string;
  turnIndex: number;
  currency: Currency;
  delta: number;
  balanceAfter: number;
  reasonCode: ReasonCode;
  meta?: any;
}

export type JobTier = 'GIG' | 'ENTRY' | 'SKILLED' | 'SENIOR';
export type BusinessTier = 'NONE' | 'SIDE_BUSINESS' | 'BUSINESS' | 'ENTERPRISE';
export type ScenarioKey = 'BROKE_YOUNG_ADULT' | 'LAID_OFF' | 'STUDENT';
export type GameStatus = 'ACTIVE' | 'LOST' | 'WON';

export interface Skills {
  workSkill: number;
  lifeSkill: number;
}

export interface GameState {
  assets?: string[];
  businessTier?: BusinessTier;

  scenario: ScenarioKey;
  seed: number;
  turnIndex: number;
  status: GameStatus;
  cash: number; // in cents
  boostTokens: number;
  incomeWeekly: number; // base income without extra work
  expensesWeekly: number;
  health: number;
  stress: number;
  happiness: number;
  actionPoints: number;
  reputation: number;
  jobTier: JobTier;
  skills: Skills;
  flags: Record<string, any>;
  ledger: LedgerEntry[];
}
