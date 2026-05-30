import { GameState, LedgerEntry } from './state.js';
import { ActionType, applyActions } from './actions.js';
import { drawAndResolveEvent } from './events/index.js';
import { makeRng } from './rng.js';
import { ACTION_POINTS_PER_WEEK, CASH_FLOOR } from './config.js';
import { applyDelta } from './economy.js';

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
  
  const totalPoints = Object.values(input.actions).reduce((sum, v) => sum + (v || 0), 0);
  if (totalPoints > ACTION_POINTS_PER_WEEK) {
    throw new Error(`Exceeded action points: ${totalPoints} > ${ACTION_POINTS_PER_WEEK}`);
  }

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
  const eventRes = drawAndResolveEvent(state, rng);
  log.push(eventRes.log);

  // 4. Clamp stats
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

  state.turnIndex++;

  return {
    state,
    newLedgerEntries: state.ledger.slice(startLedgerLen),
    log
  };
}
