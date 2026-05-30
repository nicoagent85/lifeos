import { getStartingState } from './config.js';
import { resolveTurn, TurnInput } from './resolveTurn.js';
import { GameState, ScenarioKey } from './state.js';

function parseArgs() {
  const args = process.argv.slice(2);
  let scenario: ScenarioKey = 'BROKE_YOUNG_ADULT';
  let seed = 42;
  let turns = 20;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--scenario' && args[i + 1]) scenario = args[++i] as ScenarioKey;
    if (args[i] === '--seed' && args[i + 1]) seed = parseInt(args[++i], 10);
    if (args[i] === '--turns' && args[i + 1]) turns = parseInt(args[++i], 10);
  }
  return { scenario, seed, turns };
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

function run() {
  const { scenario, seed, turns } = parseArgs();
  console.log(`Starting sim: ${scenario}, seed: ${seed}, turns: ${turns}`);
  
  let state = getStartingState(scenario, seed);
  
  for (let i = 0; i < turns; i++) {
    if (state.status !== 'ACTIVE') break;
    
    const input: TurnInput = {
      actions: {
        'WORK': 3,
        'STUDY_WORK': 1,
        'REST': 1,
        'SIDE_GIG': 0,
        'STUDY_LIFE': 0,
        'JOB_HUNT': 0
      }
    };
    
    const res = resolveTurn(state, input);
    console.log(`Turn ${String(i).padStart(2, '0')} | Cash: $${(state.cash/100).toFixed(2).padStart(7)} | Health: ${String(state.health).padStart(3)} | Stress: ${String(state.stress).padStart(3)} | Happy: ${String(state.happiness).padStart(3)} | Event: ${res.log.join(' - ')}`);
  }
  
  console.log("\nFinal Status:", state.status);
  verifyLedger(state);
}

// Allow CLI run but not when imported in tests
if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}
