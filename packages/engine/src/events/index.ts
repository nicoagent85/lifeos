import { GameState, LedgerEntry } from '../state.js';
import { applyDelta } from '../economy.js';
import { nextInt } from '../rng.js';

export interface EventResult {
  log: string;
}

export interface GameEvent {
  key: string;
  weight: number;
  resolve: (state: GameState, rng: () => number) => EventResult;
}

const events: GameEvent[] = [
  {
    key: 'NOTHING',
    weight: 40,
    resolve: (state) => ({ log: 'Nothing happened this week.' })
  },
  {
    key: 'CAR_REPAIR',
    weight: 10,
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
    resolve: (state, rng) => {
      const cost = nextInt(rng, 5000, 20000);
      applyDelta(state, 'CASH', -cost, 'EVENT_COST', { event: 'MEDICAL_BILL' });
      state.health -= 15;
      return { log: `Got sick. Medical bill $${cost/100}.` };
    }
  },
  {
    key: 'SMALL_BONUS',
    weight: 15,
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
    resolve: (state, rng) => {
      // In this version, naive auto-resolve falls for it 50%
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
    resolve: (state, rng) => {
      applyDelta(state, 'CASH', -5000, 'EVENT_COST', { event: 'FRIEND_LOAN' });
      state.happiness -= 5;
      return { log: `Lent a friend $50.` };
    }
  },
  {
    key: 'SCHOLARSHIP',
    weight: 5,
    resolve: (state, rng) => {
      applyDelta(state, 'CASH', 25000, 'EVENT_WINDFALL');
      state.happiness += 20;
      return { log: `Got a mini scholarship: $250.` };
    }
  }
];

export function drawAndResolveEvent(state: GameState, rng: () => number): EventResult {
  const totalWeight = events.reduce((sum, e) => sum + e.weight, 0);
  let roll = nextInt(rng, 0, totalWeight - 1);
  for (const event of events) {
    if (roll < event.weight) {
      return event.resolve(state, rng);
    }
    roll -= event.weight;
  }
  return events[0].resolve(state, rng);
}
