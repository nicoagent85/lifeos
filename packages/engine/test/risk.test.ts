import { describe, it, expect } from 'vitest';
import { getStartingState, startVenture, computeRiskFactors, resolveRisk } from '../src/index.js';
import { makeRng } from '../src/rng.js';

function midGame(skill = 130, life = 40, cash = 1500000, rep = 50) {
  const s: any = getStartingState('BROKE_YOUNG_ADULT', 7);
  s.turnIndex = 60; s.jobTier = 'SENIOR';
  s.skills.workSkill = skill; s.skills.lifeSkill = life;
  s.cash = cash; s.reputation = rep; s.health = 90; s.stress = 20;
  return s;
}

describe('risk engine (factor-driven)', () => {
  it('no business exposure + healthy reserves => near-zero weekly risk', () => {
    const s = midGame(60, 80, 3000000, 100);
    const f = computeRiskFactors(s);
    expect(f.probability).toBeLessThan(0.05);
  });

  it('grey-market heat raises risk well above a safe freelance', () => {
    const grey = midGame(); startVenture(grey, 'GREY_MARKET');
    grey.ventures[0].heat = 60; grey.ventures[0].delegated = true;
    const free = midGame(); startVenture(free, 'FREELANCE'); free.ventures[0].delegated = true;
    expect(computeRiskFactors(grey).probability).toBeGreaterThan(computeRiskFactors(free).probability);
  });

  it('mitigation: reserves + life skill + reputation reduce risk', () => {
    const reckless = midGame(130, 10, 600000, 0); startVenture(reckless, 'GREY_MARKET');
    reckless.ventures[0].heat = 60; reckless.cash = 50000; // thin reserves after founding
    const careful = midGame(130, 90, 5000000, 120); startVenture(careful, 'GREY_MARKET');
    careful.ventures[0].heat = 60;
    expect(computeRiskFactors(careful).probability).toBeLessThan(computeRiskFactors(reckless).probability);
  });

  it('a high-heat grey op eventually busts (loses the venture) when ridden long enough', () => {
    const s = midGame(); startVenture(s, 'GREY_MARKET');
    s.ventures[0].heat = 90; s.ventures[0].delegated = true;
    // Force the roll to fire deterministically by using an rng that returns 0 (always < prob).
    const rng = () => 0;
    const before = s.ventures.length;
    const res = resolveRisk(s, rng);
    expect(res.fired).toBe(true);
    expect(s.ventures.length).toBeLessThan(before); // venture seized
    expect(res.log).toMatch(/BUST/);
  });

  it('does not fire when the roll is above probability', () => {
    const s = midGame(); startVenture(s, 'GREY_MARKET'); s.ventures[0].heat = 30;
    const rng = () => 0.999; // always above any reasonable probability
    expect(resolveRisk(s, rng).fired).toBe(false);
  });

  it('determinism: same seed + state => same risk outcome', () => {
    const build = () => { const s = midGame(); startVenture(s, 'GREY_MARKET'); s.ventures[0].heat = 50; s.ventures[0].delegated = true; return s; };
    const a = build(); const b = build();
    const ra = resolveRisk(a, makeRng(a.seed + a.turnIndex));
    const rb = resolveRisk(b, makeRng(b.seed + b.turnIndex));
    expect(ra.fired).toBe(rb.fired);
    expect(ra.log).toBe(rb.log);
    expect(a.cash).toBe(b.cash);
    expect((a.ventures || []).length).toBe((b.ventures || []).length);
  });
});
