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
});
