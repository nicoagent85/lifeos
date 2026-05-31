import { describe, it, expect } from 'vitest';
import {
  getStartingState,
  resolveTurn,
  purchaseAsset,
  getNetWorth,
  getMilestones,
  ASSET_CATALOG,
} from '../src/index.js';

// The opening balance is not ledgered, so absolute balance != sum(deltas).
// Instead assert the invariant that each ledger entry's balanceAfter is internally
// consistent with the running sum of cash deltas (deterministic bookkeeping).
function ledgerConsistent(state: any): boolean {
  let running = 0;
  let opening: number | null = null;
  for (const e of state.ledger) {
    if (e.currency !== 'CASH') continue;
    running += e.delta;
    if (opening === null) opening = e.balanceAfter - e.delta; // infer opening from first entry
    if (e.balanceAfter !== opening + running) return false;
  }
  return true;
}

describe('assets', () => {
  it('rejects purchase when funds are insufficient', () => {
    const s = getStartingState('BROKE_YOUNG_ADULT', 1); // $500
    const res = purchaseAsset(s, 'studio_apt'); // $20k
    expect(res.ok).toBe(false);
    expect(res.error).toBe('Not enough cash');
    expect(s.assets || []).not.toContain('studio_apt');
  });

  it('rejects unknown asset', () => {
    const s = getStartingState('BROKE_YOUNG_ADULT', 1);
    expect(purchaseAsset(s, 'spaceship').ok).toBe(false);
  });

  it('enforces prerequisites (cannot buy starter_home before studio_apt)', () => {
    const s = getStartingState('BROKE_YOUNG_ADULT', 1);
    s.cash = 100000000; // plenty
    const res = purchaseAsset(s, 'starter_home');
    expect(res.ok).toBe(false);
    expect(res.error).toBe('Missing prereq');
  });

  it('buys an asset: deducts cash, applies expense delta, keeps ledger balanced, no double-buy', () => {
    const s = getStartingState('BROKE_YOUNG_ADULT', 1);
    s.cash = 100000000;
    const studio = ASSET_CATALOG.find((a) => a.id === 'studio_apt')!;
    const beforeCash = s.cash;
    const beforeExp = s.expensesWeekly;
    const res = purchaseAsset(s, 'studio_apt');
    expect(res.ok).toBe(true);
    expect(s.assets).toContain('studio_apt');
    expect(s.cash).toBe(beforeCash - studio.cost);
    // studio lowers weekly expenses (expensesWeeklyDelta is negative)
    expect(s.expensesWeekly).toBe(beforeExp + (studio.effects as any).expensesWeeklyDelta);
    expect(ledgerConsistent(s)).toBe(true);
    // double-buy rejected
    expect(purchaseAsset(s, 'studio_apt').ok).toBe(false);
  });

  it('asset statusValue counts toward net worth', () => {
    const s = getStartingState('BROKE_YOUNG_ADULT', 1);
    s.cash = 100000000;
    const nwBefore = getNetWorth(s);
    purchaseAsset(s, 'used_car'); // cost 500000, statusValue 300000
    const used = ASSET_CATALOG.find((a) => a.id === 'used_car')!;
    const nwAfter = getNetWorth(s);
    // net worth changes by (statusValue - cost) = 300000 - 500000
    expect(nwAfter).toBe(nwBefore - used.cost + (used.effects as any).statusValue);
  });
});

describe('business ladder', () => {
  it('cannot build a business without SENIOR + skill + cash', () => {
    const s = getStartingState('BROKE_YOUNG_ADULT', 1);
    // GIG job, low skill, low cash
    const res = resolveTurn(s, { actions: { BUILD_BUSINESS: 1 } as any });
    expect(s.businessTier === 'NONE' || s.businessTier === undefined).toBe(true);
    expect(res.log.join(' ')).toMatch(/requirements not met/i);
  });

  it('advances to SIDE_BUSINESS when SENIOR + skill>=110 + cash, and pays passive income', () => {
    const s = getStartingState('BROKE_YOUNG_ADULT', 1);
    s.jobTier = 'SENIOR';
    s.skills.workSkill = 120;
    s.cash = 50000000;
    s.health = 100; s.stress = 0;
    const before = s.cash;
    const res = resolveTurn(s, { actions: { BUILD_BUSINESS: 1 } as any });
    expect(s.businessTier).toBe('SIDE_BUSINESS');
    // invested cash, then should have earned some passive income on the same/next turns
    expect(s.cash).toBeLessThan(before); // investment dominated this turn
    expect(ledgerConsistent(s)).toBe(true);
    // next turn with no actions should still earn passive business income
    const cashBeforePassive = s.cash;
    resolveTurn(s, { actions: { REST: 1 } as any });
    const earned = s.ledger.some((e: any) => e.reasonCode === 'BUSINESS_INCOME' && e.delta > 0);
    expect(earned).toBe(true);
  });
});

describe('milestones + net worth', () => {
  it('reports milestones and flips done when conditions met', () => {
    const s = getStartingState('BROKE_YOUNG_ADULT', 1);
    const m0 = getMilestones(s).find((m) => m.id === 'reach_senior')!;
    expect(m0.done).toBe(false);
    s.jobTier = 'SENIOR';
    const m1 = getMilestones(s).find((m) => m.id === 'reach_senior')!;
    expect(m1.done).toBe(true);
  });

  it('net worth = cash with no assets/business', () => {
    const s = getStartingState('BROKE_YOUNG_ADULT', 1);
    expect(getNetWorth(s)).toBe(s.cash);
  });
});

describe('determinism', () => {
  it('same seed + same actions => identical net worth and tier', () => {
    const run = () => {
      const s = getStartingState('BROKE_YOUNG_ADULT', 99);
      for (let i = 0; i < 20; i++) {
        resolveTurn(s, { actions: { WORK: 2, STUDY_WORK: 2, REST: 1 } as any });
      }
      return { nw: getNetWorth(s), tier: s.businessTier, cash: s.cash, skill: s.skills.workSkill };
    };
    expect(run()).toEqual(run());
  });
});
