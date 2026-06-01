import { describe, it, expect } from 'vitest';
import {
  getStartingState, resolveTurn,
  startVenture, investInVenture, exitVenture, setVentureDelegated,
  getVentureIncome, getVentureEquity, getNetWorth, getActionCapacity,
  VENTURE_DEFS, repMultiplier,
} from '../src/index.js';

function midGame(type: keyof typeof VENTURE_DEFS) {
  const s: any = getStartingState('BROKE_YOUNG_ADULT', 7);
  s.turnIndex = 60; s.jobTier = 'SENIOR';
  s.skills.workSkill = VENTURE_DEFS[type].minWorkSkill + 10;
  s.cash = VENTURE_DEFS[type].minCapital + 5000000;
  s.reputation = 50; s.health = 90; s.stress = 20;
  return s;
}

describe('venture lifecycle', () => {
  it('rejects founding without skill or capital', () => {
    const s: any = getStartingState('BROKE_YOUNG_ADULT', 1); // low skill, low cash
    expect(startVenture(s, 'STARTUP').ok).toBe(false);
  });

  it('founds a venture: deducts capital via ledger, adds to portfolio', () => {
    const s = midGame('LOCAL_BIZ');
    const before = s.cash;
    const r = startVenture(s, 'LOCAL_BIZ');
    expect(r.ok).toBe(true);
    expect(s.ventures.length).toBe(1);
    expect(s.cash).toBe(before - VENTURE_DEFS.LOCAL_BIZ.minCapital);
    const started = s.ledger.find((e: any) => e.reasonCode === 'VENTURE_START');
    expect(started).toBeTruthy();
  });

  it('investing raises capital and (with diminishing returns) income', () => {
    const s = midGame('STARTUP');
    startVenture(s, 'STARTUP');
    const v = s.ventures[0];
    const inc0 = getVentureIncome(v, s);
    investInVenture(s, v.id, 2000000);
    const inc1 = getVentureIncome(v, s);
    expect(v.capital).toBeGreaterThan(VENTURE_DEFS.STARTUP.minCapital);
    expect(inc1).toBeGreaterThan(inc0);
    // diminishing: doubling capital should less-than-double income
    const ratio = inc1 / inc0;
    const capRatio = v.capital / VENTURE_DEFS.STARTUP.minCapital;
    expect(ratio).toBeLessThan(capRatio);
  });

  it('reputation multiplies income', () => {
    const lowRep = midGame('LOCAL_BIZ'); lowRep.reputation = 0;
    const hiRep = midGame('LOCAL_BIZ'); hiRep.reputation = 100;
    startVenture(lowRep, 'LOCAL_BIZ'); startVenture(hiRep, 'LOCAL_BIZ');
    expect(repMultiplier(hiRep)).toBeGreaterThan(repMultiplier(lowRep));
    expect(getVentureIncome(hiRep.ventures[0], hiRep)).toBeGreaterThan(getVentureIncome(lowRep.ventures[0], lowRep));
  });

  it('grey-market yields more per capital than freelance but accrues heat weekly', () => {
    const grey = midGame('GREY_MARKET'); startVenture(grey, 'GREY_MARKET');
    const free = midGame('FREELANCE'); startVenture(free, 'FREELANCE');
    // normalize by capital roughly: grey baseRate >> freelance
    expect(VENTURE_DEFS.GREY_MARKET.baseRate).toBeGreaterThan(VENTURE_DEFS.FREELANCE.baseRate);
    const h0 = grey.ventures[0].heat;
    resolveTurn(grey, { actions: { REST: 1 } as any });
    expect(grey.ventures[0].heat).toBeGreaterThan(h0);
    // freelance never accrues heat
    resolveTurn(free, { actions: { REST: 1 } as any });
    expect(free.ventures[0].heat).toBe(0);
  });

  it('pays weekly income into the ledger', () => {
    const s = midGame('LOCAL_BIZ'); startVenture(s, 'LOCAL_BIZ');
    setVentureDelegated(s, s.ventures[0].id, true);
    resolveTurn(s, { actions: { REST: 1 } as any });
    const inc = s.ledger.filter((e: any) => e.reasonCode === 'VENTURE_INCOME').reduce((a: number, e: any) => a + e.delta, 0);
    expect(inc).toBeGreaterThan(0);
  });

  it('venture equity counts toward net worth; exit realizes cash and removes it', () => {
    const s = midGame('STARTUP'); startVenture(s, 'STARTUP');
    const v = s.ventures[0];
    const nwWith = getNetWorth(s);
    const cashBefore = s.cash;
    const equity = getVentureEquity(v);
    expect(nwWith).toBeGreaterThan(s.cash); // equity adds to net worth
    const r = exitVenture(s, v.id);
    expect(r.ok).toBe(true);
    expect(s.ventures.length).toBe(0);
    expect(s.cash).toBe(cashBefore + equity);
  });

  it('an active venture costs an action point (obligation); delegating frees it', () => {
    const s = midGame('FREELANCE');
    const capNoBiz = getActionCapacity(s).total;
    startVenture(s, 'FREELANCE');
    expect(getActionCapacity(s).total).toBe(capNoBiz - 1);
    setVentureDelegated(s, s.ventures[0].id, true);
    expect(getActionCapacity(s).total).toBe(capNoBiz);
  });

  it('determinism: same seed + same venture ops => identical net worth', () => {
    const run = () => {
      const s = midGame('LOCAL_BIZ');
      s.seed = 123; s.turnIndex = 60;
      startVenture(s, 'LOCAL_BIZ');
      setVentureDelegated(s, s.ventures[0].id, true);
      investInVenture(s, s.ventures[0].id, 1000000);
      for (let i = 0; i < 10; i++) resolveTurn(s, { actions: { REST: 1 } as any });
      return getNetWorth(s);
    };
    expect(run()).toBe(run());
  });
});
