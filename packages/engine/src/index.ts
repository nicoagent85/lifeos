import { GameState, Venture, VentureType } from './state.js';

import { applyDelta } from './economy.js';
import { ASSET_CATALOG, VENTURE_DEFS, getVentureEquity, makeVentureId } from './config.js';

export function purchaseAsset(state: GameState, assetId: string): { ok: boolean, log?: string, error?: string } {
  const asset = ASSET_CATALOG.find((c: any) => c.id === assetId);
  if (!asset) return { ok: false, error: 'Unknown asset' };
  
  state.assets = state.assets || [];
  if (state.assets.includes(assetId)) return { ok: false, error: 'Already owned' };
  
  if (state.cash < asset.cost) return { ok: false, error: 'Not enough cash' };
  
  if (asset.requires && asset.requires.length > 0) {
    for (const req of asset.requires) {
      if (!state.assets.includes(req)) return { ok: false, error: 'Missing prereq' };
    }
  }
  
  applyDelta(state, 'CASH', -asset.cost, 'ASSET_PURCHASE' as any);
  state.assets.push(assetId);
  
  if (asset.effects && asset.effects.expensesWeeklyDelta) {
    state.expensesWeekly += asset.effects.expensesWeeklyDelta;
  }
  
  return { ok: true, log: `Bought ${asset.name}!` };
}

// ===== Phase B / Slice 11: venture operations (not action-point actions) =====

// Found a new venture. Founding capital becomes the venture's starting capital.
export function startVenture(state: GameState, type: VentureType): { ok: boolean, log?: string, error?: string, ventureId?: string } {
  const def = VENTURE_DEFS[type];
  if (!def) return { ok: false, error: 'Unknown venture type' };
  if (state.skills.workSkill < def.minWorkSkill)
    return { ok: false, error: `Needs Work Skill ${def.minWorkSkill}` };
  if (state.cash < def.minCapital)
    return { ok: false, error: `Needs ${def.minCapital} cents to start` };

  state.ventures = state.ventures || [];
  applyDelta(state, 'CASH', -def.minCapital, 'VENTURE_START', { type });
  const v: Venture = { id: makeVentureId(state), type, capital: def.minCapital, level: 1, heat: 0 };
  state.ventures.push(v);
  return { ok: true, log: `Started a ${def.name}.`, ventureId: v.id };
}

// Pump more capital into an existing venture (diminishing returns on income).
export function investInVenture(state: GameState, ventureId: string, amountCents: number): { ok: boolean, log?: string, error?: string } {
  if (amountCents <= 0) return { ok: false, error: 'Amount must be positive' };
  const v = (state.ventures || []).find(x => x.id === ventureId);
  if (!v) return { ok: false, error: 'Venture not found' };
  if (state.cash < amountCents) return { ok: false, error: 'Not enough cash' };
  applyDelta(state, 'CASH', -amountCents, 'VENTURE_INVEST', { ventureId });
  v.capital += amountCents;
  // Every doubling of capital nudges level up (raises ceiling), capped.
  v.level = Math.min(10, 1 + Math.floor(Math.log2(Math.max(1, v.capital / VENTURE_DEFS[v.type].minCapital))));
  return { ok: true, log: `Invested into venture.` };
}

// Sell/exit a venture: realize its equity as cash, remove it.
export function exitVenture(state: GameState, ventureId: string): { ok: boolean, log?: string, error?: string } {
  const list = state.ventures || [];
  const idx = list.findIndex(x => x.id === ventureId);
  if (idx === -1) return { ok: false, error: 'Venture not found' };
  const v = list[idx];
  const equity = getVentureEquity(v);
  applyDelta(state, 'CASH', equity, 'VENTURE_EXIT', { ventureId, type: v.type });
  list.splice(idx, 1);
  return { ok: true, log: `Sold venture for ${equity} cents.` };
}

// Toggle delegate on a venture (frees its obligation AP at an income cut handled in income calc).
export function setVentureDelegated(state: GameState, ventureId: string, delegated: boolean): { ok: boolean, error?: string } {
  const v = (state.ventures || []).find(x => x.id === ventureId);
  if (!v) return { ok: false, error: 'Venture not found' };
  v.delegated = delegated;
  return { ok: true };
}

export * from './state.js';
export * from './config.js';
export * from './economy.js';
export * from './actions.js';
export * from './events/index.js';
export * from './resolveTurn.js';
export * from './rng.js';
export * from './risk.js';
