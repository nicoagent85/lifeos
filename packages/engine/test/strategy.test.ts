import { describe, it, expect } from 'vitest';
import { getStartingState } from '../src/config.js';
import { resolveTurn } from '../src/resolveTurn.js';

describe('Strategies Tension', () => {
  it('smart-survives', () => {
    let state = getStartingState('BROKE_YOUNG_ADULT', 42);
    for (let i = 0; i < 30; i++) {
      if (state.status !== 'ACTIVE') break;
      resolveTurn(state, {
        actions: { WORK: 2, STUDY_WORK: 1, JOB_HUNT: 1, EAT_HEALTHY: 1, WORK_OUT: 0, HAVE_FUN: 0, REST: 0, SIDE_GIG: 0, STUDY_LIFE: 0 }
      });
    }
    expect(state.status).toBe('ACTIVE');
    expect(state.jobTier).not.toBe('GIG');
    expect(state.cash).toBeGreaterThan(-500000);
  });

  it('extremes-still-lose', () => {
    let grinder = getStartingState('BROKE_YOUNG_ADULT', 42);
    for (let i = 0; i < 30; i++) {
      if (grinder.status !== 'ACTIVE') break;
      resolveTurn(grinder, {
        actions: { WORK: 3, STUDY_WORK: 2, JOB_HUNT: 0, EAT_HEALTHY: 0, WORK_OUT: 0, HAVE_FUN: 0, REST: 0, SIDE_GIG: 0, STUDY_LIFE: 0 }
      });
    }
    expect(grinder.status).toBe('LOST');
    expect(grinder.health).toBeLessThanOrEqual(0);

    let balanced = getStartingState('BROKE_YOUNG_ADULT', 42);
    for (let i = 0; i < 30; i++) {
      if (balanced.status !== 'ACTIVE') break;
      resolveTurn(balanced, {
        actions: { WORK: 2, STUDY_WORK: 1, EAT_HEALTHY: 1, HAVE_FUN: 1, WORK_OUT: 0, JOB_HUNT: 0, REST: 0, SIDE_GIG: 0, STUDY_LIFE: 0 }
      });
    }
    expect(balanced.status).toBe('LOST');
    expect(balanced.cash).toBeLessThan(-50000);
  });
});
