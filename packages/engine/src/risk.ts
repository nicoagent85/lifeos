import { GameState } from './state.js';
import { applyDelta } from './economy.js';
import { VENTURE_DEFS } from './config.js';

export interface RiskResult {
  fired: boolean;
  log: string;
}

export interface RiskFactors {
  greyHeat: number;       // total grey-market heat across ventures
  leverage: number;       // 0..1, low reserves vs obligations
  neglect: number;        // 0..1, high stress + low life skill
  overextension: number;  // 0..1, more ventures than capacity to run
  ventureVol: number;     // max venture volatility
  probability: number;    // final clamped weekly probability 0..1
  mitigation: number;     // 0..1, reduces severity (reserves/lifeSkill/reputation)
}

const WEEKLY_RESERVE_TARGET = 2000000; // $20k buffer is "safe"

// All risk is FACTOR-DRIVEN (Jaime: "depend on other factors", "this is real life") — never pure RNG.
export function computeRiskFactors(state: GameState): RiskFactors {
  const ventures = state.ventures || [];

  const greyHeat = ventures.reduce((s, v) => s + (v.heat || 0), 0);

  // Leverage: how thin is your cash cushion relative to weekly expenses + obligations?
  const obligations = ventures.filter(v => !v.delegated).length + ((state.businessTier && state.businessTier !== 'NONE' && !(state as any).businessDelegated) ? 1 : 0);
  const buffer = Math.max(0, state.cash);
  const leverage = clamp01(1 - buffer / (WEEKLY_RESERVE_TARGET + obligations * 500000));

  // Neglect: burning out + poor judgment (low life skill) invites mistakes.
  const neglect = clamp01((state.stress / 100) * 0.6 + (1 - Math.min(1, state.skills.lifeSkill / 80)) * 0.4);

  // Over-extension: running more hands-on ventures than you realistically can.
  const handsOn = ventures.filter(v => !v.delegated).length;
  const overextension = clamp01((handsOn - 1) / 3);

  const ventureVol = ventures.reduce((m, v) => Math.max(m, VENTURE_DEFS[v.type].volatility), 0);

  // Base weekly probability assembled from factors. Heat is the dominant driver for grey ops,
  // but capped so a careful operator who manages heat can sometimes run clean.
  let probability =
    Math.min(0.30, greyHeat / 600) +   // heat ramps slowly: short grey stints are a fair gamble
    leverage * 0.05 +
    neglect * 0.05 +
    overextension * 0.07 +
    ventureVol * ventureVol * 0.08;    // volatility matters quadratically -> freelance ~safe, startup risky

  // Mitigation: deep reserves, life skill (judgment), reputation (goodwill) soften blows.
  const mitigation = clamp01(
    Math.min(1, buffer / (WEEKLY_RESERVE_TARGET * 2)) * 0.4 +
    Math.min(1, state.skills.lifeSkill / 100) * 0.35 +
    Math.min(1, Math.max(0, state.reputation) / 120) * 0.25
  );

  probability = clamp01(probability * (1 - mitigation * 0.5));

  return { greyHeat, leverage, neglect, overextension, ventureVol, probability, mitigation };
}

function clamp01(x: number) { return Math.max(0, Math.min(1, x)); }

// Roll the weekly risk. Deterministic: caller passes the per-turn rng.
// Risk only applies to players with business/venture EXPOSURE — never random punishment for a
// plain worker (Jaime: risk must depend on factors/choices, not pure RNG).
export function resolveRisk(state: GameState, rng: () => number): RiskResult {
  const hasExposure = (Array.isArray(state.ventures) && state.ventures.length > 0)
    || (state.businessTier !== undefined && state.businessTier !== 'NONE');
  if (!hasExposure) return { fired: false, log: '' };

  const f = computeRiskFactors(state);
  if (f.probability <= 0) return { fired: false, log: '' };

  if (rng() >= f.probability) return { fired: false, log: '' };

  // Severity scales with the same factors, softened by mitigation.
  const severity = clamp01((0.4 + f.greyHeat / 150 + f.ventureVol * 0.4 + f.leverage * 0.3) * (1 - f.mitigation * 0.6));
  const ventures = state.ventures || [];
  const hottestIdx = ventures.reduce((best, v, i) => (v.heat > (ventures[best]?.heat ?? -1) ? i : best), -1);

  // Grey-market bust: high heat -> can wipe the venture, hit reputation + cash + stress.
  if (f.greyHeat > 0 && hottestIdx >= 0 && rng() < 0.5 + severity * 0.4) {
    const v = ventures[hottestIdx];
    if (severity > 0.6) {
      // Bust: lose the venture entirely.
      ventures.splice(hottestIdx, 1);
      state.reputation = Math.max(0, state.reputation - 25);
      state.stress = Math.min(100, state.stress + 35);
      applyDelta(state, 'CASH', -Math.min(state.cash > 0 ? state.cash : 0, 1000000), 'VENTURE_LOSS', { event: 'GREY_BUST' });
      return { fired: true, log: `BUST! Your grey-market operation got raided — venture seized, reputation hit, and a brutal week.` };
    } else {
      // Fine / shakedown: pay up, lose some heat, take stress.
      const fine = Math.min(Math.max(0, state.cash), 200000 + Math.floor(severity * 800000));
      applyDelta(state, 'CASH', -fine, 'VENTURE_LOSS', { event: 'GREY_FINE' });
      v.heat = Math.max(0, v.heat - 20);
      state.stress = Math.min(100, state.stress + 15);
      return { fired: true, log: `Close call — paid $${(fine / 100).toFixed(0)} to make a grey-market problem go away.` };
    }
  }

  // Generic business setback (downturn, lawsuit, bad client) scaled by severity.
  if (ventures.length > 0 || (state.businessTier && state.businessTier !== 'NONE')) {
    const loss = Math.min(Math.max(0, state.cash), 150000 + Math.floor(severity * 1200000));
    applyDelta(state, 'CASH', -loss, 'VENTURE_LOSS', { event: 'BIZ_SETBACK' });
    state.stress = Math.min(100, state.stress + Math.floor(10 + severity * 20));
    if (severity > 0.7 && ventures.length > 0) {
      // Severe: knock down the weakest venture's capital.
      const weakest = ventures.reduce((w, v) => (v.capital < ventures[w].capital ? ventures.indexOf(v) : w), 0);
      ventures[weakest].capital = Math.floor(ventures[weakest].capital * 0.5);
      return { fired: true, log: `Major setback: a lawsuit/downturn cost you $${(loss / 100).toFixed(0)} and gutted a venture.` };
    }
    return { fired: true, log: `Business setback cost you $${(loss / 100).toFixed(0)} and some sleep.` };
  }

  // Should be unreachable (we gated on exposure above), but stay safe.
  return { fired: false, log: '' };
}
