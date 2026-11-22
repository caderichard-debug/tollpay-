'use strict';

/**
 * Demo provider: deterministic SAMPLE data so the UI can be exercised without
 * a real data source. Every record is flagged `demo: true` and the UI labels
 * it as sample data. Never enable in production.
 */

// FNV-1a hash -> seeded PRNG (mulberry32), so the same plate always gives the same sample.
function seed(str) {
  let h = 0x811c9dc5;
  for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}
function rng(s) {
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LOCATIONS = ['Main Line Plaza', 'Exit 12 Gantry', 'Bridge Crossing', 'Express Lanes', 'Northbound Gantry', 'Airport Connector'];

function demoLookup(agency, plate, state, now = new Date()) {
  const r = rng(seed(`${plate}|${state}|${agency.id}`));
  // Agencies in the plate's home state are more likely to have tolls.
  const chance = agency.states.includes(state) ? 0.6 : 0.08;
  if (r() > chance) return { status: 'clear', tolls: [] };

  const count = 1 + Math.floor(r() * 3);
  const tolls = [];
  for (let i = 0; i < count; i++) {
    const daysAgo = 3 + Math.floor(r() * 80);
    const date = new Date(now.getTime() - daysAgo * 86400000);
    const amount = Math.round((1.5 + r() * 14) * 100) / 100;
    const fee = daysAgo > 30 ? Math.round(r() * 2500) / 100 : 0;
    tolls.push({
      id: `DEMO-${agency.id.toUpperCase()}-${i + 1}`,
      date: date.toISOString().slice(0, 10),
      location: LOCATIONS[Math.floor(r() * LOCATIONS.length)],
      amount,
      fees: fee,
      dueDate: new Date(date.getTime() + 30 * 86400000).toISOString().slice(0, 10),
      demo: true,
    });
  }
  tolls.sort((a, b) => b.date.localeCompare(a.date));
  return { status: 'found', tolls };
}

module.exports = { demoLookup };
