import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { query } from '../src/db.js';
import { sanitizeNumber } from './utils.js';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
async function ensureSchema() {
  const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  await query(sql);
}
function sanitizeNumberLocal(n) {
  if (n === null || n === undefined) return null;
  const num = Number(String(n).replace(/[^0-9.\-]/g, ''));
  return Number.isNaN(num) ? null : num;
}
async function seed() {
  await ensureSchema();
  const jsonPath = path.join(__dirname, 'US_recipes.json');
  if (!fs.existsSync(jsonPath)) { console.error('Missing file: server_postgres/scripts/US_recipes.json'); process.exit(1); }
  const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const records = Array.isArray(raw) ? raw : Object.values(raw);
  console.log(`Loaded ${records.length} recipes`);
  await query('TRUNCATE TABLE recipes RESTART IDENTITY');
  const insertSql = `INSERT INTO recipes (cuisine, title, rating, prep_time, cook_time, total_time, description, nutrients, serves) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`;
  let inserted = 0;
  for (const r of records) {
    const cuisine = r.cuisine ?? null; const title = r.title ?? null;
    const rating = sanitizeNumberLocal(r.rating); const prep_time = sanitizeNumberLocal(r.prep_time);
    const cook_time = sanitizeNumberLocal(r.cook_time); const total_time = sanitizeNumberLocal(r.total_time);
    const description = r.description ?? null; const nutrients = r.nutrients || {}; const normalized = {};
    for (const k of Object.keys(nutrients)) { const v = nutrients[k]; const num = Number(String(v).replace(/[^0-9.\-]/g, '')); normalized[k] = Number.isNaN(num) ? null : num; }
    const serves = r.serves ?? null;
    try { await query(insertSql, [cuisine, title, rating, prep_time, cook_time, total_time, description, JSON.stringify(normalized), serves]); inserted++; } catch (e) { console.error('Insert error for title:', title, e.message); }
  }
  console.log(`Inserted ${inserted} recipes`); process.exit(0);
}
seed().catch((e) => { console.error(e); process.exit(1); });
