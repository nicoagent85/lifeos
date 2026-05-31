import { describe, it, expect } from 'vitest';
import { getStartingState, getActionCapacity, getLifeStage, AP_MIN, AP_MAX } from '../src/index.js';
import { resolveTurn } from '../src/resolveTurn.js';

describe('dynamic action capacity', () => {
  it('young + thriving has more time than a stressed peak-career owner', () => {
    const young: any = getStartingState('BROKE_YOUNG_ADULT', 1);
    young.turnIndex = 2; young.health = 100; young.stress = 0;
    const youngCap = getActionCapacity(young).total;

    const peak: any = getStartingState('BROKE_YOUNG_ADULT', 1);
    peak.turnIndex = 100; peak.health = 30; peak.stress = 90; peak.businessTier = 'BUSINESS';
    const peakCap = getActionCapacity(peak).total;

    expect(youngCap).toBeGreaterThan(peakCap);
  });

  it('life stage maps to turnIndex bands', () => {
    const s: any = getStartingState('BROKE_YOUNG_ADULT', 1);
    s.turnIndex = 0; expect(getLifeStage(s)).toBe('EARLY');
    s.turnIndex = 40; expect(getLifeStage(s)).toBe('ESTABLISHING');
    s.turnIndex = 100; expect(getLifeStage(s)).toBe('PEAK');
    s.turnIndex = 200; expect(getLifeStage(s)).toBe('LATE');
  });

  it('thriving grants +1, falling apart costs -1', () => {
    const base: any = getStartingState('BROKE_YOUNG_ADULT', 1);
    base.turnIndex = 40; // ESTABLISHING (stage mod 0) to isolate wellbeing
    base.health = 60; base.stress = 50;
    const mid = getActionCapacity(base).total;

    const thriving = { ...base, health: 100, stress: 0 };
    const wreck = { ...base, health: 20, stress: 95 };
    expect(getActionCapacity(thriving as any).total).toBe(mid + 1);
    expect(getActionCapacity(wreck as any).total).toBe(mid - 1);
  });

  it('an active (non-delegated) business costs an action point; delegating frees it', () => {
    const s: any = getStartingState('BROKE_YOUNG_ADULT', 1);
    s.turnIndex = 40; s.health = 60; s.stress = 50;
    const noBiz = getActionCapacity(s).total;
    s.businessTier = 'BUSINESS';
    const handsOn = getActionCapacity(s).total;
    expect(handsOn).toBe(noBiz - 1);
    s.businessDelegated = true;
    const delegated = getActionCapacity(s).total;
    expect(delegated).toBe(noBiz);
  });

  it('capacity is clamped to [AP_MIN, AP_MAX]', () => {
    const wreck: any = getStartingState('BROKE_YOUNG_ADULT', 1);
    wreck.turnIndex = 100; wreck.health = 5; wreck.stress = 100;
    wreck.businessTier = 'ENTERPRISE';
    expect(getActionCapacity(wreck).total).toBeGreaterThanOrEqual(AP_MIN);
    expect(getActionCapacity(wreck).total).toBeLessThanOrEqual(AP_MAX);
  });

  it('resolveTurn enforces dynamic capacity (throws when over)', () => {
    const s: any = getStartingState('BROKE_YOUNG_ADULT', 1);
    s.turnIndex = 100; s.health = 30; s.stress = 90; s.businessTier = 'BUSINESS'; // low cap
    const cap = getActionCapacity(s).total;
    const over = cap + 1;
    expect(() => resolveTurn(s, { actions: { REST: over } as any })).toThrow(/Exceeded action points/);
  });

  it('delegated business pays reduced income vs hands-on', () => {
    const handsOn: any = getStartingState('BROKE_YOUNG_ADULT', 1);
    handsOn.turnIndex = 40; handsOn.health = 90; handsOn.stress = 10;
    handsOn.businessTier = 'BUSINESS';
    const cashH0 = handsOn.cash;
    resolveTurn(handsOn, { actions: { REST: 1 } as any });
    const earnedHandsOn = handsOn.ledger.filter((e: any) => e.reasonCode === 'BUSINESS_INCOME').reduce((a: number, e: any) => a + e.delta, 0);

    const deleg: any = getStartingState('BROKE_YOUNG_ADULT', 1);
    deleg.turnIndex = 40; deleg.health = 90; deleg.stress = 10;
    deleg.businessTier = 'BUSINESS'; deleg.businessDelegated = true;
    resolveTurn(deleg, { actions: { REST: 1 } as any });
    const earnedDeleg = deleg.ledger.filter((e: any) => e.reasonCode === 'BUSINESS_INCOME').reduce((a: number, e: any) => a + e.delta, 0);

    expect(earnedDeleg).toBeLessThan(earnedHandsOn);
    expect(earnedDeleg).toBeGreaterThan(0);
  });
});
