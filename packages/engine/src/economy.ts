import { GameState, Currency, ReasonCode, LedgerEntry } from './state.js';

export function applyDelta(
  state: GameState, 
  currency: Currency, 
  delta: number, 
  reasonCode: ReasonCode, 
  meta?: any
): LedgerEntry {
  if (currency === 'CASH') {
    state.cash += delta;
  } else {
    state.boostTokens += delta;
  }

  const entry: LedgerEntry = {
    id: `${state.turnIndex}-${state.ledger.length}`,
    turnIndex: state.turnIndex,
    currency,
    delta,
    balanceAfter: currency === 'CASH' ? state.cash : state.boostTokens,
    reasonCode,
    meta
  };
  
  state.ledger.push(entry);
  return entry;
}
