export type Currency = 'CASH' | 'BOOST_TOKEN';

export type ReasonCode = 'ASSET_PURCHASE' | 'BUSINESS_INVEST' | 'BUSINESS_INCOME' | 'WAGE' | 'SIDE_GIG' | 'RENT' | 'FOOD' | 'BILLS' | 'EVENT_COST' | 'EVENT_WINDFALL' | 'WELLBEING' | 'VENTURE_START' | 'VENTURE_INVEST' | 'VENTURE_INCOME' | 'VENTURE_EXIT' | 'VENTURE_LOSS';

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

export type VentureType = 'FREELANCE' | 'LOCAL_BIZ' | 'STARTUP' | 'GREY_MARKET';

export interface Venture {
  id: string;
  type: VentureType;
  capital: number;   // cents invested
  level: number;     // upgrade level (1+)
  heat: number;      // grey-market exposure; feeds the risk engine
  delegated?: boolean;
}

export interface GameState {
  assets?: string[];
  businessTier?: BusinessTier;
  ventures?: Venture[];

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
