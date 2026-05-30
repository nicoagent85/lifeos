import { GameState } from './state.js';
import { applyDelta } from './economy.js';
import { WAGE_BY_TIER } from './config.js';

export type ActionType = 'WORK' | 'STUDY_WORK' | 'STUDY_LIFE' | 'REST' | 'JOB_HUNT' | 'SIDE_GIG';

export function applyActions(state: GameState, actions: Record<ActionType, number>) {
  for (const [action, points] of Object.entries(actions) as [ActionType, number][]) {
    if (points <= 0) continue;
    
    switch (action) {
      case 'WORK':
        applyDelta(state, 'CASH', WAGE_BY_TIER[state.jobTier] * points, 'WAGE');
        state.stress += 5 * points;
        state.health -= 2 * points;
        break;
      case 'SIDE_GIG':
        applyDelta(state, 'CASH', 8000 * points, 'SIDE_GIG');
        state.stress += 8 * points;
        state.health -= 3 * points;
        break;
      case 'STUDY_WORK':
        state.skills.workSkill += 2 * points;
        state.stress += 3 * points;
        break;
      case 'STUDY_LIFE':
        state.skills.lifeSkill += 2 * points;
        break;
      case 'REST':
        state.health += 10 * points;
        state.stress -= 10 * points;
        state.happiness += 5 * points;
        break;
      case 'JOB_HUNT':
        state.stress += 5 * points;
        // implementation for job hunting success probability
        break;
    }
  }
}
