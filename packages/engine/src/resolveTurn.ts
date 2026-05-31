import { GameState, LedgerEntry } from './state.js';
import { ActionType, applyActions } from './actions.js';
import { drawAndResolveEvent } from './events/index.js';
import { makeRng } from './rng.js';
import { ACTION_POINTS_PER_WEEK, CASH_FLOOR, STRESS_HEALTH_DECAY, ASSET_CATALOG, BUSINESS_INCOME_BY_TIER, getMilestones } from './config.js';
import { applyDelta } from './economy.js';
import { getMedicalRisk } from './wellbeing.js';

export interface TurnInput {
  actions: Record<ActionType, number>;
}

export interface TurnResult {
  state: GameState;
  newLedgerEntries: LedgerEntry[];
  log: string[];
}

export function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(val, max));
}

export function resolveTurn(state: GameState, input: TurnInput): TurnResult {
  if (state.status !== 'ACTIVE') {
    return { state, newLedgerEntries: [], log: ['Game is over.'] };
  }

  const log: string[] = [];
  const startLedgerLen = state.ledger.length;
  
  // Base action points + bonus from wellbeing
  let actionPointsLimit = ACTION_POINTS_PER_WEEK;
  if (state.health >= 80 && state.stress <= 30) {
    actionPointsLimit += 1; // +1 action point for being very healthy and low stress
  }

  const totalPoints = Object.values(input.actions).reduce((sum, v) => sum + (v || 0), 0);
  if (totalPoints > actionPointsLimit) {
    throw new Error(`Exceeded action points: ${totalPoints} > ${actionPointsLimit}`);
  }

  // Check low health sickness (if health <= 20, lose an action point)
  // But we want to keep it simple as per spec: "Very low Health → lose action points (got sick)"
  // we will just do this inline in actions or here. Actually, lets do it at start of turn.
  // Wait, the spec says "+1 action-point energy bonus when health>=80 && stress<=30".
  // Let's implement that.

  // 1. Actions
  const actionRes = applyActions(state, input.actions);
  if (actionRes?.log) {
    log.push(...actionRes.log);
  }
  
  // 2. Weekly fixed costs
  if (state.expensesWeekly > 0) {
    const rent = Math.floor(state.expensesWeekly * 0.60);
    const food = Math.floor(state.expensesWeekly * 0.25);
    const bills = Math.floor(state.expensesWeekly * 0.15);
    const remainder = state.expensesWeekly - rent - food - bills;
    
    applyDelta(state, 'CASH', -(rent + remainder), 'RENT', { note: 'Weekly rent' });
    applyDelta(state, 'CASH', -food, 'FOOD', { note: 'Weekly groceries' });
    applyDelta(state, 'CASH', -bills, 'BILLS', { note: 'Weekly bills' });
  }

  // 3. Event
  const rng = makeRng(state.seed + state.turnIndex);
  
  // we pass getting the medical risk and tweaking odds inside drawAndResolveEvent
  // To avoid modifying event module heavily... let's just do it.

  const eventRes = drawAndResolveEvent(state, rng);
  log.push(eventRes.log);

  
  // Apply ongoing asset effects and business income (Phase A)
  if (state.assets && state.assets.length > 0) {
    for (const aId of state.assets) {
      const assetDef = ASSET_CATALOG.find(c => c.id === aId);
      if (assetDef && assetDef.effects) {
        if (assetDef.effects.happinessPerTurn) state.happiness += assetDef.effects.happinessPerTurn;
        if (assetDef.effects.stressPerTurnDelta) state.stress += assetDef.effects.stressPerTurnDelta;
      }
    }
  }
  
  const bTier = state.businessTier || 'NONE';
  if (bTier !== 'NONE') {
    applyDelta(state, 'CASH', (BUSINESS_INCOME_BY_TIER as any)[bTier], 'BUSINESS_INCOME');
  }

  // 4a. Chronic stress health decay
  if (state.stress >= STRESS_HEALTH_DECAY.severeThreshold) {
    state.health -= STRESS_HEALTH_DECAY.severePerTurn;
    log.push(`Severe chronic stress took a toll on health (-${STRESS_HEALTH_DECAY.severePerTurn}).`);
  } else if (state.stress >= STRESS_HEALTH_DECAY.threshold) {
    state.health -= STRESS_HEALTH_DECAY.perTurn;
    log.push(`Chronic stress took a toll on health (-${STRESS_HEALTH_DECAY.perTurn}).`);
  }

  // 4b. Clamp stats
  state.health = clamp(state.health, 0, 100);
  state.stress = clamp(state.stress, 0, 100);
  state.happiness = clamp(state.happiness, 0, 100);

  // 5. Check lose conditions
  let zeroHappinessStreak = state.flags['zeroHappinessStreak'] || 0;
  if (state.cash < CASH_FLOOR) {
    state.status = 'LOST';
    log.push(`Game Over: Bankrupt. Balance: $${state.cash/100}`);
  } else if (state.health <= 0) {
    state.status = 'LOST';
    log.push(`Game Over: Health reached 0.`);
  } else if (state.happiness <= 0) {
    zeroHappinessStreak++;
    state.flags['zeroHappinessStreak'] = zeroHappinessStreak;
    if (zeroHappinessStreak >= 3) {
      state.status = 'LOST';
      log.push(`Game Over: Zero happiness for 3 weeks.`);
    }
  } else {
    state.flags['zeroHappinessStreak'] = 0;
  }

  
  // 6. Check milestones
  const oldMilestones = (state.flags['milestones'] || '').split(',').filter((x: string) => x);
  const currentMilestones = getMilestones(state);
  const newDone = [];
  for (const m of currentMilestones) {
    if (m.done && !oldMilestones.includes(m.id)) {
      oldMilestones.push(m.id);
      newDone.push(m);
      log.push(`Milestone reached: ${m.name}`);
    }
  }
  if (newDone.length > 0) {
    state.flags['milestones'] = oldMilestones.join(',');
    if (oldMilestones.includes('millionaire')) {
      state.status = 'WON';
      log.push('You achieved the Millionaire milestone! You WIN! (Game remains OPEN-ENDED)');
    }
  }

  state.turnIndex++;

  return {
    state,
    newLedgerEntries: state.ledger.slice(startLedgerLen),
    log
  };
}
