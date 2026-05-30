import { GameState } from './state.js';
import { applyDelta } from './economy.js';
import { WAGE_BY_TIER, PROMOTION_SKILL_THRESHOLDS } from './config.js';
import { getIncomeFactor, wellnessSponsorOffer } from './wellbeing.js';

export type ActionType = 'WORK' | 'STUDY_WORK' | 'STUDY_LIFE' | 'REST' | 'JOB_HUNT' | 'SIDE_GIG' | 'EAT_HEALTHY' | 'WORK_OUT' | 'HAVE_FUN';

export function applyActions(state: GameState, actions: Record<ActionType, number>) {
  const log: string[] = [];
  
  // Track if we already promoted this turn
  let promoted = false;

  for (const [action, points] of Object.entries(actions) as [ActionType, number][]) {
    if (points <= 0) continue;
    
    switch (action) {
      case 'WORK': {
        const factor = getIncomeFactor(state);
        const wage = Math.round(WAGE_BY_TIER[state.jobTier] * factor);
        applyDelta(state, 'CASH', wage * points, 'WAGE');
        state.stress += 5 * points;
        state.health -= 2 * points;
        break;
      }
      case 'SIDE_GIG': {
        const factor = getIncomeFactor(state);
        const gigWage = Math.round(8000 * factor);
        applyDelta(state, 'CASH', gigWage * points, 'SIDE_GIG');
        state.stress += 8 * points;
        state.health -= 3 * points;
        break;
      }
      case 'STUDY_WORK':
        // Faster skill gain when not maxed-stress
        if (state.stress < 80) {
            state.skills.workSkill += 3 * points;
        } else {
            state.skills.workSkill += 2 * points;
        }
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
      case 'EAT_HEALTHY':
        wellnessSponsorOffer(state);
        applyDelta(state, 'CASH', -2500 * points, 'WELLBEING'); // $25 cost
        state.health += 15 * points;
        state.happiness += 5 * points;
        break;
      case 'WORK_OUT':
        wellnessSponsorOffer(state);
        // Costs action points (already handled by the outer loop consuming points)
        state.health += 10 * points;
        state.stress -= 15 * points;
        break;
      case 'HAVE_FUN':
        applyDelta(state, 'CASH', -5000 * points, 'WELLBEING'); // $50 cost
        state.stress -= 30 * points;
        state.happiness += 20 * points;
        break;
      case 'JOB_HUNT':
        state.stress += 5 * points;
        if (!promoted) {
          const threshold = PROMOTION_SKILL_THRESHOLDS[state.jobTier as keyof typeof PROMOTION_SKILL_THRESHOLDS];
          if (threshold && state.skills.workSkill >= threshold) {
            const tiers = Object.keys(PROMOTION_SKILL_THRESHOLDS) as (keyof typeof PROMOTION_SKILL_THRESHOLDS)[];
            const currentIdx = tiers.indexOf(state.jobTier as keyof typeof PROMOTION_SKILL_THRESHOLDS);
            if (currentIdx !== -1 && currentIdx < tiers.length) {
                const allTiers = Object.keys(WAGE_BY_TIER) as (keyof typeof WAGE_BY_TIER)[];
                const actIdx = allTiers.indexOf(state.jobTier as keyof typeof WAGE_BY_TIER);
                if (actIdx !== -1 && actIdx < allTiers.length - 1) {
                    const nextTier = allTiers[actIdx + 1];
                    state.jobTier = nextTier;
                    state.reputation += 5;
                    log.push(`Promoted to ${nextTier}!`);
                    promoted = true;
                }
            }
          } else {
             state.reputation += 2 * points;
             log.push(`Job hunting... no offer yet (need workSkill ${threshold || 'N/A'})`);
          }
        } else {
          state.reputation += 2 * points;
          log.push(`Job hunting... (already promoted this turn)`);
        }
        break;
    }
  }
  return { log };
}
