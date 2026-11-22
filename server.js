'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { STATES, normalizePlate, normalizeState } = require('./src/states');
const { lookupAll, AGENCIES } = require('./src/providers');

const PORT = Number(process.env.PORT) || 3000;
// Demo data is on by default outside production; set DEMO_MODE=false to disable.
const DEMO = process.env.DEMO_MODE
  ? process.env.DEMO_MODE === 'true'
  : process.env.NODE_ENV !== 'production';

const PUBLIC_DIR = path.join(__dirname, 'public');
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; frame-ancestors 'none'; base-uri 'none'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
};

// Simple in-memory rate limit: 30 lookups / minute / IP.
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 30;
}
setInterval(() => { const now = Date.now(); for (const [ip, t] of hits) if (!t.some((x) => now - x < 60000)) hits.delete(ip); }, 60000).unref();

function send(res, status, body, headers = {}) {
  res.writeHead(status, { ...SECURITY_HEADERS, ...headers });
  res.end(body);
}
const json = (res, status, obj) => send(res, status, JSON.stringify(obj), { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });

function readBody(req, limit = 10_000) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > limit) { reject(new Error('too large')); req.destroy(); } });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

async function handle(req, res) {
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname === '/api/config' && req.method === 'GET') {
    return json(res, 200, { demo: DEMO, states: STATES, agencyCount: AGENCIES.length });
  }

  if (url.pathname === '/api/lookup') {
    if (req.method !== 'POST') return json(res, 405, { error: 'Use POST' });
    if (rateLimited(req.socket.remoteAddress)) return json(res, 429, { error: 'Too many lookups. Try again in a minute.' });
    let body;
    try { body = JSON.parse(await readBody(req)); } catch { return json(res, 400, { error: 'Invalid JSON body' }); }
    const plate = normalizePlate(body.plate);
    const state = normalizeState(body.state);
    if (!plate) return json(res, 400, { error: 'Enter a valid plate (1–8 letters or numbers).' });
    if (!state) return json(res, 400, { error: 'Choose the state that issued the plate.' });
    return json(res, 200, await lookupAll(plate, state, { demo: DEMO }));
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
  const rel = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname).replace(/^\/+/, '');
  const file = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!file.startsWith(PUBLIC_DIR + path.sep)) return send(res, 403, 'Forbidden');
  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, 'Not found', { 'Content-Type': 'text/plain' });
    send(res, 200, data, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  });
}

function createServer() {
  return http.createServer((req, res) => {
    handle(req, res).catch((err) => { console.error(err); json(res, 500, { error: 'Internal error' }); });
  });
}

if (require.main === module) {
  createServer().listen(PORT, () => {
    console.log(`TollPay running at http://localhost:${PORT} (demo data: ${DEMO ? 'ON' : 'off'})`);
  });
}

module.exports = { createServer };
