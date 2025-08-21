/**
 * tools/api_test.js
 * Usage: node tools/api_test.js http://localhost:4001
 *
 * Output: pass/fail summary for the API checklist
 */

import axios from 'axios';

if (process.argv.length < 3) {
  console.error('Usage: node tools/api_test.js <BASE_URL>');
  process.exit(2);
}
const BASE = process.argv[2].replace(/\/$/, ''); // no trailing slash

const client = axios.create({
  baseURL: BASE,
  timeout: 8000,
});

function pass(msg) { console.log('\x1b[32m%s\x1b[0m', 'PASS:', msg); }
function fail(msg) { console.log('\x1b[31m%s\x1b[0m', 'FAIL:', msg); }

async function healthCheck() {
  try {
    const r = await client.get('/api/health');
    if (r.data && (r.data.status === 'ok' || r.status === 200)) {
      pass('Health check returned ok');
      return true;
    } else {
      fail('Health check responded but not ok: ' + JSON.stringify(r.data));
      return false;
    }
  } catch (e) {
    fail('Health check failed: ' + (e.message || e));
    return false;
  }
}

async function listCheck() {
  try {
    const r = await client.get('/api/recipes?page=1&limit=5');
    if (!r.data) { fail('/api/recipes returned no JSON'); return false; }
    const okProps = ('page' in r.data) && ('limit' in r.data) && ('total' in r.data) && Array.isArray(r.data.data);
    if (!okProps) { fail('/api/recipes response shape incorrect: ' + JSON.stringify(Object.keys(r.data))); return false; }
    pass('/api/recipes returned paginated data');
    const arr = r.data.data;
    if (arr.length >= 2) {
      const ratings = arr.map(x => (x.rating === undefined || x.rating === null) ? -Infinity : Number(x.rating));
      const sorted = [...ratings].sort((a,b)=>b-a);
      if (JSON.stringify(ratings) === JSON.stringify(sorted)) pass('Results appear sorted by rating desc (sample)');
      else fail('Results are not sorted by rating desc (sample). First ratings: ' + ratings.slice(0,5).join(','));
    } else {
      pass('Not enough items to validate sort — returned ' + arr.length + ' items');
    }
    return true;
  } catch (e) {
    fail('/api/recipes failed: ' + (e.message || e));
    return false;
  }
}

async function searchChecks() {
  let ok = true;
  try {
    const r1 = await client.get('/api/recipes/search?title=pie&rating=>=3');
    if (!r1.data) { fail('search (title) returned no JSON'); ok = false; }
    else pass('Search with title returned JSON');

    try {
      await client.get('/api/recipes/search?rating=invalid_number');
      fail('search accepted invalid comparator (expected 400 or validation error).');
      ok = false;
    } catch (e) {
      pass('search rejected invalid comparator (expected).');
    }

    try {
      const rcal = await client.get('/api/recipes/search?calories=<=400');
      if (rcal.data && Array.isArray(rcal.data)) pass('calories filter returned array');
      else pass('calories filter returned data (non-array format) — check results manually');
    } catch(e) {
      fail('calories filter request failed: ' + e.message);
      ok = false;
    }

  } catch (e) {
    fail('Search checks failed: ' + e.message);
    ok = false;
  }
  return ok;
}

async function nutrientsCheck() {
  try {
    const r = await client.get('/api/recipes?page=1&limit=10');
    const arr = r.data?.data || [];
    if (arr.length === 0) { fail('No recipes to validate nutrients'); return false; }
    const hasNutr = arr.some(x => x.nutrients || x.calories || (x.nutrients && x.nutrients.calories !== undefined));
    if (hasNutr) pass('At least one recipe includes nutrients/calories');
    else fail('No recipes include nutrients/calories fields; seed may not have normalized nutrients');
    return hasNutr;
  } catch (e) {
    fail('nutrients check failed: ' + e.message);
    return false;
  }
}

async function runAll() {
  console.log('Running API tests against', BASE);
  const results = [];
  results.push(await healthCheck());
  results.push(await listCheck());
  results.push(await searchChecks());
  results.push(await nutrientsCheck());

  const passed = results.filter(x=>x).length;
  console.log('---');
  if (passed === results.length) console.log('\x1b[32m%s\x1b[0m', `ALL CHECKS PASSED (${passed}/${results.length})`);
  else console.log('\x1b[33m%s\x1b[0m', `SOME CHECKS FAILED (${passed}/${results.length}) — review failures above`);
}

runAll();
