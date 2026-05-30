import { describe, it, expect } from 'vitest';
import { getStartingState } from '../src/config';
import { resolveTurn } from '../src/resolveTurn';

describe('Strategies Tension', () => {
  it('smart-survives', () => {
    let state = getStartingState('BROKE_YOUNG_ADULT', 42);
    for (let i = 0; i < 30; i++) {
      if (state.status !== 'ACTIVE') break;
      if (state.stress > 65) {
        resolveTurn(state, {
          actions: { WORK: 2, STUDY_WORK: 1, JOB_HUNT: 1, EAT_HEALTHY: 0, WORK_OUT: 1, HAVE_FUN: 0, REST: 0, SIDE_GIG: 0, STUDY_LIFE: 0 }
        });
      } else {
        if (state.health < 80) {
           resolveTurn(state, {
             actions: { WORK: 2, STUDY_WORK: 1, JOB_HUNT: 1, EAT_HEALTHY: 1, WORK_OUT: 0, HAVE_FUN: 0, REST: 0, SIDE_GIG: 0, STUDY_LIFE: 0 }
           });
        } else {
           resolveTurn(state, {
             actions: { WORK: 2, STUDY_WORK: 1, JOB_HUNT: 1, EAT_HEALTHY: 0, WORK_OUT: 0, HAVE_FUN: 1, REST: 0, SIDE_GIG: 0, STUDY_LIFE: 0 }
           });
        }
      }
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

  it('stress-has-teeth', () => {
    let state = getStartingState('BROKE_YOUNG_ADULT', 42);
    state.stress = 95; // force high stress
    const startHealth = state.health;
    resolveTurn(state, {
      actions: { WORK: 2, STUDY_WORK: 1, JOB_HUNT: 1, EAT_HEALTHY: 0, WORK_OUT: 0, HAVE_FUN: 0, REST: 1, SIDE_GIG: 0, STUDY_LIFE: 0 } // REST offsets some stress but let's test absolute health drop from turn
    });
    // actually, let's just make them study life to do nothing to health/stress
    let s2 = getStartingState('BROKE_YOUNG_ADULT', 42);
    s2.stress = 100;
    const h1 = s2.health;
    resolveTurn(s2, {
      actions: { STUDY_LIFE: 5, WORK: 0, STUDY_WORK: 0, JOB_HUNT: 0, EAT_HEALTHY: 0, WORK_OUT: 0, HAVE_FUN: 0, REST: 0, SIDE_GIG: 0 }
    });
    expect(s2.health).toBeLessThan(h1);
  });
});
