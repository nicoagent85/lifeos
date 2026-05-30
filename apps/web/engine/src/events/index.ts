import { GameState, LedgerEntry } from '../state.js';
import { applyDelta } from '../economy.js';
import { nextInt } from '../rng.js';
import { getMedicalRisk, getEventWeightModifiers } from '../wellbeing.js';

export interface EventResult {
  log: string;
}

export interface GameEvent {
  key: string;
  weight: number;
  isGood: boolean;
  resolve: (state: GameState, rng: () => number) => EventResult;
}

const events: GameEvent[] = [
  {
    key: 'NOTHING',
    weight: 40,
    isGood: true,
    resolve: (state) => ({ log: 'Nothing happened this week.' })
  },
  {
    key: 'CAR_REPAIR',
    weight: 10,
    isGood: false,
    resolve: (state, rng) => {
      const cost = nextInt(rng, 10000, 40000);
      applyDelta(state, 'CASH', -cost, 'EVENT_COST', { event: 'CAR_REPAIR' });
      state.stress += 20;
      return { log: `Car broke down. Repair cost $${cost/100}.` };
    }
  },
  {
    key: 'MEDICAL_BILL',
    weight: 10,
    isGood: false,
    resolve: (state, rng) => {
      const risk = getMedicalRisk(state.health);
      const baseCost = nextInt(rng, 5000, 20000);
      const cost = Math.round(baseCost * risk.costMultiplierTarget);
      applyDelta(state, 'CASH', -cost, 'EVENT_COST', { event: 'MEDICAL_BILL' });
      state.health -= 15;
      return { log: `Got sick. Medical bill $${cost/100}.` };
    }
  },
  {
    key: 'SMALL_BONUS',
    weight: 15,
    isGood: true,
    resolve: (state, rng) => {
      const bonus = nextInt(rng, 5000, 15000);
      applyDelta(state, 'CASH', bonus, 'EVENT_WINDFALL');
      state.happiness += 10;
      return { log: `Small bonus at work! Got $${bonus/100}.` };
    }
  },
  {
    key: 'RENT_HIKE',
    weight: 5,
    isGood: false,
    resolve: (state, rng) => {
      const increase = nextInt(rng, 2000, 5000);
      state.expensesWeekly += increase;
      state.stress += 30;
      return { log: `Landlord raised rent by $${increase/100} per week.` };
    }
  },
  {
    key: 'SCAM_OFFER',
    weight: 10,
    isGood: false,
    resolve: (state, rng) => {
      if (nextInt(rng, 0, 100) > 50) {
        applyDelta(state, 'CASH', -10000, 'EVENT_COST', { event: 'SCAM_OFFER' });
        state.happiness -= 20;
        return { log: `Fell for a scam. Lost $100.` };
      }
      return { log: `Ignored a scam text.` };
    }
  },
  {
    key: 'FRIEND_LOAN',
    weight: 5,
    isGood: false,
    resolve: (state, rng) => {
      applyDelta(state, 'CASH', -5000, 'EVENT_COST', { event: 'FRIEND_LOAN' });
      state.happiness -= 5;
      return { log: `Lent a friend $50.` };
    }
  },
  {
    key: 'SCHOLARSHIP',
    weight: 5,
    isGood: true,
    resolve: (state, rng) => {
      applyDelta(state, 'CASH', 25000, 'EVENT_WINDFALL');
      state.happiness += 20;
      return { log: `Got a mini scholarship: $250.` };
    }
  }
];

export function drawAndResolveEvent(state: GameState, rng: () => number): EventResult {
  const overrides = new Map<string, number>();
  
  // Apply medical risk override to MEDICAL_BILL weight
  const medicalRisk = getMedicalRisk(state.health);
  overrides.set('MEDICAL_BILL', medicalRisk.weightTarget);

  let totalWeight = 0;
  const computedWeights = events.map(e => {
    let base = overrides.has(e.key) ? overrides.get(e.key)! : e.weight;
    let finalWeight = getEventWeightModifiers(state, base, e.isGood);
    totalWeight += finalWeight;
    return finalWeight;
  });

  let roll = nextInt(rng, 0, totalWeight - 1);
  for (let i = 0; i < events.length; i++) {
    const w = computedWeights[i];
    if (roll < w) {
      return events[i].resolve(state, rng);
    }
    roll -= w;
  }
  return events[0].resolve(state, rng);
}
