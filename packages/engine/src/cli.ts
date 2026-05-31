
import { getStartingState, getNetWorth, getActionCapacity } from './config.js';
import { resolveTurn, TurnInput } from './resolveTurn.js';
import { GameState, ScenarioKey } from './state.js';
import { purchaseAsset } from './index.js';
import { ASSET_CATALOG } from './config.js';

function parseArgs() {
  const args = process.argv.slice(2);
  let scenario: ScenarioKey = 'BROKE_YOUNG_ADULT';
  let seed = 42;
  let turns = 20;
  let strategy = 'grinder';

  // default to CLI positional for simple npm run sim <strat> <seed> <turns>
  if (args.length > 0 && !args[0].startsWith('--')) {
      strategy = args[0];
      if (args[1]) seed = parseInt(args[1], 10);
      if (args[2]) turns = parseInt(args[2], 10);
      return { scenario, seed, turns, strategy };
  }

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--scenario' && args[i + 1]) scenario = args[++i] as ScenarioKey;
    if (args[i] === '--seed' && args[i + 1]) seed = parseInt(args[++i], 10);
    if (args[i] === '--turns' && args[i + 1]) turns = parseInt(args[++i], 10);
    if (args[i] === '--strategy' && args[i + 1]) strategy = args[++i];
  }
  return { scenario, seed, turns, strategy };
}

function verifyLedger(state: GameState) {
  let cash = getStartingState(state.scenario, state.seed).cash;
  let bt = 0;
  for (const entry of state.ledger) {
    if (entry.currency === 'CASH') cash += entry.delta;
    else bt += entry.delta;
  }
  if (cash === state.cash && bt === state.boostTokens) {
    console.log("LEDGER OK");
  } else {
    console.log(`LEDGER MISMATCH: computed cash=${cash}, state cash=${state.cash}`);
  }
}

// Skill needed to advance the business ladder from the current tier (mirrors BUSINESS_SKILL_REQ).
function businessSkillNeed(state: GameState): number | null {
    const tier = state.businessTier || 'NONE';
    if (tier === 'NONE') return 110;
    if (tier === 'SIDE_BUSINESS') return 160;
    if (tier === 'BUSINESS') return 220;
    return null; // ENTERPRISE = maxed
}

function businessCashNeed(state: GameState): number {
    const tier = state.businessTier || 'NONE';
    if (tier === 'NONE') return 200000;
    if (tier === 'SIDE_BUSINESS') return 1000000;
    if (tier === 'BUSINESS') return 5000000;
    return Infinity;
}

function getTycoonActions(state: GameState) {
    if (!state.assets) state.assets = [];

    // Once we own a business, delegate it so it doesn't eat our time/stress while we keep climbing.
    if (state.businessTier && state.businessTier !== 'NONE') {
      (state as any).businessDelegated = true;
    }

    // Wellbeing first — never let a recoverable life collapse.
    if (state.health < 50) return { REST: 2, EAT_HEALTHY: 1, WORK_OUT: 1, HAVE_FUN: 1 };
    if (state.stress > 55) return { REST: 1, HAVE_FUN: 1, WORK_OUT: 1, WORK: 1 };

    // Phase 1: climb the job ladder to SENIOR.
    if (state.jobTier !== 'SENIOR') {
      if (state.skills.workSkill < 90) return { WORK: 2, STUDY_WORK: 2, REST: 1 };
      return { JOB_HUNT: 2, WORK: 1, STUDY_WORK: 1, REST: 1 };
    }

    // At SENIOR: spend spare cash on the next affordable asset (keep a buffer).
    const pendingAssets = ASSET_CATALOG.filter(a => !(state.assets || []).includes(a.id));
    for (const a of pendingAssets) {
       if (state.cash > a.cost + 300000) { // keep ~$3k buffer
           if (purchaseAsset(state, a.id).ok) break; // one buy/turn
       }
    }

    const skillNeed = businessSkillNeed(state);
    const cashNeed = businessCashNeed(state);

    // Ladder maxed (ENTERPRISE): bank passive income + keep healthy.
    if (skillNeed === null) return { WORK: 2, REST: 2, HAVE_FUN: 1 };

    // Ready to advance the business this turn? Build it.
    if (state.skills.workSkill >= skillNeed && state.cash >= cashNeed) {
        return { BUILD_BUSINESS: 1, WORK: 2, STUDY_WORK: 1, REST: 1 };
    }

    // Not enough skill yet → STUDY hard (this is the whole point: skill matters past SENIOR).
    if (state.skills.workSkill < skillNeed) {
        return { STUDY_WORK: 3, WORK: 1, REST: 1 };
    }

    // Enough skill, saving cash for the investment → work for capital.
    return { WORK: 3, STUDY_WORK: 1, REST: 1 };
}


function run() {
  const { scenario, seed, turns, strategy } = parseArgs();
  console.log(`Starting sim: ${scenario}, seed: ${seed}, turns: ${turns}, strategy: ${strategy}`);
  
  let state = getStartingState(scenario, seed);
  
  for (let i = 0; i < turns; i++) {
    if (state.status !== 'ACTIVE' && state.status !== 'WON') break;
    
    let actions: any = { WORK: 0, STUDY_WORK: 0, JOB_HUNT: 0, REST: 0, SIDE_GIG: 0, STUDY_LIFE: 0, EAT_HEALTHY: 0, WORK_OUT: 0, HAVE_FUN: 0, BUILD_BUSINESS: 0 };
    
    // basic logic
    if (strategy === 'grinder') {
        actions.WORK = 3; actions.STUDY_WORK = 2;
    } else if (strategy === 'smart') {
         if (state.health < 80) { actions.WORK=2; actions.STUDY_WORK=1; actions.JOB_HUNT=1; actions.EAT_HEALTHY=1; }
         else { actions.WORK=2; actions.STUDY_WORK=1; actions.JOB_HUNT=1; actions.HAVE_FUN=1; }
    } else if (strategy === 'tycoon') {
         const ta: any = getTycoonActions(state);
         for(let k of Object.keys(ta)) {
            actions[k] = ta[k];
         }
    } else {
        actions.WORK = 2; actions.STUDY_WORK = 2; actions.JOB_HUNT = 1;
    }

    // Respect dynamic weekly capacity (Phase B): trim overflow, then fill the rest with REST.
    const limit = getActionCapacity(state).total;
    let total = Object.values(actions).reduce((a:any,b:any)=>a+b, 0) as number;
    if (total > limit) {
      // drop from the back until within capacity
      const keys = Object.keys(actions);
      let idx = keys.length - 1;
      while (total > limit && idx >= 0) {
        if (actions[keys[idx]] > 0) { actions[keys[idx]]--; total--; }
        else idx--;
      }
    }
    if (total < limit) actions.REST = (actions.REST || 0) + (limit - total);

    const res = resolveTurn(state, { actions });
    
    const nw = getNetWorth(state);
    const bTier = state.businessTier || 'NONE';
    console.log(`Turn ${String(i).padStart(2, '0')} | Cash: $${(state.cash/100).toFixed(2).padStart(7)} | NetW: $${(nw/100).toFixed(2).padStart(8)} | BTier: ${bTier.substring(0,4)} | Job: ${state.jobTier.padEnd(7)} | Event: ${res.log.join(' - ')}`);
  }
  
  console.log("\nFinal Status:", state.status);
  verifyLedger(state);
}

if (process.argv[1].endsWith('cli.ts')) {
   run();
}
