import express from 'express';
import Recipe from '../models/Recipe.js';
const router = express.Router();
function parseComparator(input) { if (!input) return null; const m = String(input).trim().match(/^(<=|>=|=|<|>)\s*(.+)$/); if (!m) return null; const op = m[1]; const raw = m[2]; const num = Number(String(raw).replace(/[^0-9.\-]/g, '')); if (Number.isNaN(num)) return null; return { op, value: num }; }
router.get('/', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 200);
    const skip = (page - 1) * limit;
    const total = await Recipe.countDocuments({});
    const data = await Recipe.find({}).sort({ rating: -1 }).skip(skip).limit(limit).lean();
    res.json({ page, limit, total, data });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});
router.get('/search', async (req, res) => {
  try {
    const { title, cuisine } = req.query;
    const ratingCmp = parseComparator(req.query.rating);
    const timeCmp = parseComparator(req.query.total_time);
    const caloriesCmp = parseComparator(req.query.calories);
    const q = {};
    if (title) q.title = { $regex: title, $options: 'i' };
    if (cuisine) q.cuisine = cuisine;
    if (ratingCmp) { const map = { '>': '$gt', '>=': '$gte', '<': '$lt', '<=': '$lte', '=': '$eq' }; q.rating = { [map[ratingCmp.op]]: ratingCmp.value }; }
    if (timeCmp) { const map = { '>': '$gt', '>=': '$gte', '<': '$lt', '<=': '$lte', '=': '$eq' }; q.total_time = { [map[timeCmp.op]]: timeCmp.value }; }
    if (caloriesCmp) { const map = { '>': '$gt', '>=': '$gte', '<': '$lt', '<=': '$lte', '=': '$eq' }; q['nutrients.calories'] = { [map[caloriesCmp.op]]: caloriesCmp.value }; }
    const docs = await Recipe.find(q).sort({ rating: -1 }).limit(200).lean();
    res.json({ data: docs });
  } catch (err) { console.error(err); res.status(400).json({ error: 'Invalid query parameters' }); }
});
export default router;
