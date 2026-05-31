import { GameState } from './state.js';

import { applyDelta } from './economy.js';
import { ASSET_CATALOG } from './config.js';

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
export * from './state.js';
export * from './config.js';
export * from './economy.js';
export * from './actions.js';
export * from './events/index.js';
export * from './resolveTurn.js';
export * from './rng.js';
