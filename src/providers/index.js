'use strict';

const { AGENCIES } = require('./agencies');
const { demoLookup } = require('./demo');

const TIMEOUT_MS = 8000;

function withTimeout(promise, ms) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('timeout')), ms); }),
  ]).finally(() => clearTimeout(timer));
}

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Query every agency in parallel. Returns one result per agency:
 *   status 'found'  – outstanding tolls returned
 *   status 'clear'  – agency checked, nothing owed
 *   status 'manual' – no automated lookup; user must check the portal
 *   status 'error'  – automated lookup failed
 */
async function lookupAll(plate, state, { demo = false, agencies = AGENCIES } = {}) {
  const results = await Promise.all(agencies.map(async (agency) => {
    const base = {
      agencyId: agency.id, agency: agency.name, network: agency.network,
      states: agency.states, payUrl: agency.url, homeState: agency.states.includes(state),
    };
    try {
      let res;
      if (typeof agency.lookup === 'function') res = await withTimeout(Promise.resolve(agency.lookup(plate, state)), TIMEOUT_MS);
      else if (demo) res = demoLookup(agency, plate, state);
      else return { ...base, status: 'manual', tolls: [] };
      const tolls = res.tolls || [];
      const due = round2(tolls.reduce((s, t) => s + (t.amount || 0) + (t.fees || 0), 0));
      return { ...base, status: res.status, tolls, due };
    } catch (err) {
      return { ...base, status: 'error', error: err.message, tolls: [] };
    }
  }));

  const order = { found: 0, error: 1, manual: 2, clear: 3 };
  results.sort((a, b) => order[a.status] - order[b.status]
    || Number(b.homeState) - Number(a.homeState)
    || a.agency.localeCompare(b.agency));

  const found = results.filter((r) => r.status === 'found');
  return {
    plate, state, demo,
    checkedAt: new Date().toISOString(),
    totalDue: round2(found.reduce((s, r) => s + r.due, 0)),
    tollCount: found.reduce((s, r) => s + r.tolls.length, 0),
    summary: {
      found: found.length,
      clear: results.filter((r) => r.status === 'clear').length,
      manual: results.filter((r) => r.status === 'manual').length,
      error: results.filter((r) => r.status === 'error').length,
    },
    results,
  };
}

module.exports = { lookupAll, AGENCIES };
