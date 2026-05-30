import { GameState } from './state.js';
import { HEALTH_INCOME_MULTIPLIERS, STRESS_INCOME_PENALTY, HEALTH_MEDICAL_RISK } from './config.js';

export function getIncomeFactor(state: GameState): number {
  let factor = 1.0;
  // Apply health multiplier
  for (const thresholdStr in HEALTH_INCOME_MULTIPLIERS) {
    const threshold = parseInt(thresholdStr, 10);
    if (state.health >= threshold) {
      factor = HEALTH_INCOME_MULTIPLIERS[threshold as keyof typeof HEALTH_INCOME_MULTIPLIERS];
    } else {
      break;
    }
  }
  // Apply stress penalty
  if (state.stress >= STRESS_INCOME_PENALTY.severeThreshold) {
    factor *= STRESS_INCOME_PENALTY.severeMultiplier;
  } else if (state.stress >= STRESS_INCOME_PENALTY.threshold) {
    factor *= STRESS_INCOME_PENALTY.multiplier;
  }
  return factor;
}

export function getMedicalRisk(health: number): { weightTarget: number, costMultiplierTarget: number } {
  let risk = { weightTarget: 1, costMultiplierTarget: 1.0 };
  for (const thresholdStr in HEALTH_MEDICAL_RISK) {
    const threshold = parseInt(thresholdStr, 10);
    if (health <= threshold) {
      risk = HEALTH_MEDICAL_RISK[threshold as keyof typeof HEALTH_MEDICAL_RISK];
      break;
    }
  }
  return risk;
}

export function getEventWeightModifiers(state: GameState, baseWeight: number, isGood: boolean): number {
  let modifier = 1.0;
  if (isGood) {
      if (state.health >= 80) modifier *= 1.2;
      if (state.stress >= 80) modifier *= 0.8;
  } else {
      if (state.health <= 30) modifier *= 1.5;
      if (state.stress >= 80) modifier *= 1.5;
  }
  return Math.max(1, Math.round(baseWeight * modifier));
}

export function wellnessSponsorOffer(state: GameState): void {
  // Stubbed hook: would interact with UI/Ads here.
  // We do not actually change state in this stub to maintain strict determinism, or we could if requested.
  // The spec says "Stubbed wellnessSponsorOffer(state) hook only — NO real ads/UI"
}
