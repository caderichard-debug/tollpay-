'use strict';

/**
 * US toll agencies and their pay-by-plate / violation lookup portals.
 *
 * None of these agencies publish a public API for plate lookups, so each one is
 * a "manual" provider by default: the site links the user straight to the
 * agency's portal. To add live lookups for an agency (e.g. through a licensed
 * data partner), give its entry a `lookup(plate, state)` function that returns
 * { status: 'found' | 'clear', tolls: [...] }. See README.md.
 *
 * `states` lists where the agency operates toll facilities. `network` groups
 * interoperable systems (a plate can rack up tolls on any of them).
 */
const AGENCIES = [
  // --- E-ZPass network (Northeast / Midwest / Mid-Atlantic) ---
  { id: 'ny-tbm',   name: 'Tolls by Mail NY',               network: 'E-ZPass', states: ['NY'], url: 'https://www.tollsbymailny.com' },
  { id: 'ny-ezp',   name: 'E-ZPass New York',               network: 'E-ZPass', states: ['NY'], url: 'https://www.e-zpassny.com' },
  { id: 'nj-ezp',   name: 'E-ZPass New Jersey',             network: 'E-ZPass', states: ['NJ'], url: 'https://www.ezpassnj.com' },
  { id: 'pa-tp',    name: 'PA Turnpike Toll By Plate',      network: 'E-ZPass', states: ['PA'], url: 'https://www.paturnpike.com' },
  { id: 'md-ezp',   name: 'DriveEzMD (Maryland)',           network: 'E-ZPass', states: ['MD'], url: 'https://driveezmd.com' },
  { id: 'de-ezp',   name: 'E-ZPass Delaware',               network: 'E-ZPass', states: ['DE'], url: 'https://www.ezpassde.com' },
  { id: 'va-ezp',   name: 'E-ZPass Virginia',               network: 'E-ZPass', states: ['VA'], url: 'https://www.ezpassva.com' },
  { id: 'wv-tp',    name: 'West Virginia Parkways',         network: 'E-ZPass', states: ['WV'], url: 'https://www.wvturnpike.com' },
  { id: 'ma-ezd',   name: 'EZDriveMA',                      network: 'E-ZPass', states: ['MA'], url: 'https://www.ezdrivema.com' },
  { id: 'nh-ezp',   name: 'E-ZPass New Hampshire',          network: 'E-ZPass', states: ['NH'], url: 'https://www.ezpassnh.com' },
  { id: 'me-tp',    name: 'Maine Turnpike',                 network: 'E-ZPass', states: ['ME'], url: 'https://www.maineturnpike.com' },
  { id: 'ri-ezp',   name: 'E-ZPass Rhode Island',           network: 'E-ZPass', states: ['RI'], url: 'https://www.ezpassri.com' },
  { id: 'oh-tp',    name: 'Ohio Turnpike',                  network: 'E-ZPass', states: ['OH'], url: 'https://www.ohioturnpike.org' },
  { id: 'in-ezp',   name: 'E-ZPass Indiana',                network: 'E-ZPass', states: ['IN'], url: 'https://www.ezpassin.com' },
  { id: 'il-tw',    name: 'Illinois Tollway',               network: 'E-ZPass', states: ['IL'], url: 'https://www.illinoistollway.com' },
  { id: 'ky-rl',    name: 'RiverLink (Louisville)',         network: 'E-ZPass', states: ['KY', 'IN'], url: 'https://www.riverlink.com' },
  { id: 'nc-qp',    name: 'NC Quick Pass',                  network: 'E-ZPass', states: ['NC'], url: 'https://www.ncquickpass.com' },
  { id: 'ks-tp',    name: 'Kansas Turnpike (KTAG)',         network: 'E-ZPass', states: ['KS'], url: 'https://www.ksturnpike.com' },

  // --- Southeast ---
  { id: 'fl-sp',    name: 'SunPass / Toll-By-Plate',        network: 'SunPass', states: ['FL'], url: 'https://www.sunpass.com' },
  { id: 'fl-cfx',   name: 'Central Florida Expressway (E-PASS)', network: 'SunPass', states: ['FL'], url: 'https://www.cfxway.com' },
  { id: 'fl-thea',  name: 'Tampa Hillsborough Expressway',  network: 'SunPass', states: ['FL'], url: 'https://www.tampa-xway.com' },
  { id: 'ga-pp',    name: 'Peach Pass (Georgia)',           network: 'Peach Pass', states: ['GA'], url: 'https://www.peachpass.com' },

  // --- Central ---
  { id: 'tx-txtag', name: 'TxTag (TxDOT)',                  network: 'Texas', states: ['TX'], url: 'https://www.txtag.org' },
  { id: 'tx-ntta',  name: 'NTTA (Dallas–Fort Worth)',       network: 'Texas', states: ['TX'], url: 'https://www.ntta.org' },
  { id: 'tx-hctra', name: 'HCTRA EZ TAG (Houston)',         network: 'Texas', states: ['TX'], url: 'https://www.hctra.org' },
  { id: 'tx-ctrma', name: 'Central Texas Mobility Authority', network: 'Texas', states: ['TX'], url: 'https://www.mobilityauthority.com' },
  { id: 'ok-pp',    name: 'PikePass / PlatePay (Oklahoma)', network: 'Central', states: ['OK'], url: 'https://www.pikepass.com' },
  { id: 'la-gp',    name: 'GeauxPass (Louisiana)',          network: 'Central', states: ['LA'], url: 'https://www.geauxpass.com' },

  // --- West ---
  { id: 'co-e470',  name: 'E-470 (Denver)',                 network: 'West', states: ['CO'], url: 'https://www.e-470.com' },
  { id: 'co-et',    name: 'ExpressToll (Colorado)',         network: 'West', states: ['CO'], url: 'https://www.expresstoll.com' },
  { id: 'ca-bafs',  name: 'Bay Area FasTrak',               network: 'FasTrak', states: ['CA'], url: 'https://www.bayareafastrak.org' },
  { id: 'ca-ttr',   name: 'The Toll Roads (Orange County)', network: 'FasTrak', states: ['CA'], url: 'https://thetollroads.com' },
  { id: 'wa-gtg',   name: 'Good To Go! (Washington)',       network: 'West', states: ['WA'], url: 'https://mygoodtogo.com' },
];

module.exports = { AGENCIES };
