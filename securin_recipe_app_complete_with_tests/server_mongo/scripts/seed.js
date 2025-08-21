import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Recipe from '../src/models/Recipe.js';
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/recipes_db';
function sanitizeNumber(v) { if (v === undefined || v === null) return null; const s = String(v).trim().replace(/[^0-9.\-]/g, ''); if (s === '') return null; const n = Number(s); return Number.isFinite(n) ? n : null; }
async function run() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const dataPath = path.join(__dirname, 'US_recipes.json');
    if (!fs.existsSync(dataPath)) { console.error('Place US_recipes.json at scripts/US_recipes.json'); process.exit(1); }
    const raw = JSON.parse(fs.readFileSync(dataPath, 'utf8')); const items = Array.isArray(raw) ? raw : Object.values(raw);
    console.log(`Loaded ${items.length} recipes from JSON.`);
    await Recipe.deleteMany({});
    let inserted = 0;
    for (const r of items) {
      const nutrients = r.nutrients || {}; const normalizedNutrients = {};
      for (const [k, v] of Object.entries(nutrients)) { normalizedNutrients[k] = sanitizeNumber(v); }
      const doc = { cuisine: r.cuisine ?? null, title: r.title ?? null, rating: sanitizeNumber(r.rating), prep_time: sanitizeNumber(r.prep_time), cook_time: sanitizeNumber(r.cook_time), total_time: sanitizeNumber(r.total_time), description: r.description ?? null, nutrients: normalizedNutrients, serves: r.serves ?? null };
      try { await Recipe.create(doc); inserted++; } catch (e) { console.error('Insert error for title:', r.title, e.message); }
    }
    console.log(`Inserted ${inserted} / ${items.length} recipes.`);
    await mongoose.disconnect(); process.exit(0);
  } catch (e) { console.error(e); process.exit(1); }
}
run();
