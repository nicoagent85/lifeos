import { describe, it, expect } from 'vitest';
import { getStartingState } from '../src/config.js';
import { resolveTurn, TurnInput } from '../src/resolveTurn.js';

describe('Engine', () => {
  it('determinism: same seed yields same outcome', () => {
    function runSim() {
      let state = getStartingState('BROKE_YOUNG_ADULT', 42);
      const input: TurnInput = { actions: { WORK: 3, STUDY_WORK: 1, REST: 1, SIDE_GIG: 0, STUDY_LIFE: 0, JOB_HUNT: 0 } };
      for (let i = 0; i < 20; i++) resolveTurn(state, input);
      return state;
    }
    const a = runSim();
    const b = runSim();
    expect(a).toEqual(b);
  });

  it('ledger-integrity', () => {
    const seeds = [1, 42, 99, 1000];
    for (const seed of seeds) {
      let state = getStartingState('BROKE_YOUNG_ADULT', seed);
      const startCash = state.cash;
      const input: TurnInput = { actions: { WORK: 3, STUDY_WORK: 1, REST: 1, SIDE_GIG: 0, STUDY_LIFE: 0, JOB_HUNT: 0 } };
      for (let i = 0; i < 20; i++) resolveTurn(state, input);
      
      let sumCash = startCash;
      for (const entry of state.ledger) {
        if (entry.currency === 'CASH') sumCash += entry.delta;
      }
      expect(sumCash).toBe(state.cash);
    }
  });

  it('golden-master', () => {
    let state = getStartingState('BROKE_YOUNG_ADULT', 42);
    const input: TurnInput = { actions: { WORK: 3, STUDY_WORK: 1, REST: 1, SIDE_GIG: 0, STUDY_LIFE: 0, JOB_HUNT: 0 } };
    for (let i = 0; i < 20; i++) resolveTurn(state, input);

    expect(state.cash).toBe(-481); // hardcode based on running it
    expect(state.health).toBe(89);
    expect(state.turnIndex).toBe(20);
    expect(state.status).toBe('ACTIVE');
  });

  it('lose-condition', () => {
    let state = getStartingState('BROKE_YOUNG_ADULT', 1);
    // don't work, just REST -> drain cash due to rent
    const input: TurnInput = { actions: { WORK: 0, STUDY_WORK: 0, REST: 5, SIDE_GIG: 0, STUDY_LIFE: 0, JOB_HUNT: 0 } };
    
    while(state.status === 'ACTIVE' && state.turnIndex < 50) {
      resolveTurn(state, input);
    }

    expect(state.status).toBe('LOST');
    expect(state.cash).toBeLessThan(-50000);
  });

  it('expense-split test', () => {
    let state = getStartingState('BROKE_YOUNG_ADULT', 1);
    const expectedExpense = state.expensesWeekly;
    const input: TurnInput = { actions: { WORK: 0, STUDY_WORK: 0, REST: 5, SIDE_GIG: 0, STUDY_LIFE: 0, JOB_HUNT: 0 } };
    const { newLedgerEntries } = resolveTurn(state, input);
    
    const expenseEntries = newLedgerEntries.filter(e => e.reasonCode === 'RENT' || e.reasonCode === 'FOOD' || e.reasonCode === 'BILLS');
    const totalExpenseDelta = expenseEntries.reduce((sum, e) => sum + e.delta, 0);
    expect(totalExpenseDelta).toBe(-expectedExpense);
    
    const hasRent = expenseEntries.some(e => e.reasonCode === 'RENT');
    const hasFood = expenseEntries.some(e => e.reasonCode === 'FOOD');
    const hasBills = expenseEntries.some(e => e.reasonCode === 'BILLS');
    
    expect(hasRent).toBe(true);
    expect(hasFood).toBe(true);
    expect(hasBills).toBe(true);
  });

  it('promotion test', () => {
    let state = getStartingState('BROKE_YOUNG_ADULT', 1);
    state.skills.workSkill = 28; // Just below ENTRY threshold (30)
    expect(state.jobTier).toBe('GIG');

    // STUDY_WORK to cross threshold, then JOB_HUNT
    const input: TurnInput = { actions: { WORK: 0, STUDY_WORK: 2, REST: 2, SIDE_GIG: 0, STUDY_LIFE: 0, JOB_HUNT: 1 } };
    const res = resolveTurn(state, input);
    
    expect(state.skills.workSkill).toBe(32); // crossed threshold
    expect(state.jobTier).toBe('ENTRY');
    
    const logContainsPromotion = res.log.some(l => l.includes('Promoted to ENTRY!'));
    expect(logContainsPromotion).toBe(true);

    const prevCash = state.cash;
    // Now work 1 pt
    const res2 = resolveTurn(state, { actions: { WORK: 1, STUDY_WORK: 0, REST: 4, SIDE_GIG: 0, STUDY_LIFE: 0, JOB_HUNT: 0 } });
    
    // Look for wage entry in ledger for the second turn
    const wageEntry = res2.newLedgerEntries.find(e => e.reasonCode === 'WAGE');
    expect(wageEntry?.delta).toBe(20000); // ENTRY wage
  });
});
