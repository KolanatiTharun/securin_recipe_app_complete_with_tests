import express from 'express';
import { query } from '../db.js';
const router = express.Router();
function parseComparator(input) {
  if (!input) return null;
  const match = String(input).match(/^(<=|>=|=|<|>)\s*(.+)$/);
  if (!match) return null;
  const op = match[1]; const raw = match[2]; const num = Number(String(raw).replace(/[^0-9.\-]/g,'')); if (Number.isNaN(num)) return null;
  return { op, value: num };
}
router.get('/', async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
  const offset = (page - 1) * limit;
  try {
    const totalRes = await query('SELECT COUNT(*)::int AS count FROM recipes');
    const total = totalRes.rows[0].count;
    const dataRes = await query(`SELECT * FROM recipes ORDER BY rating DESC NULLS LAST, id ASC LIMIT $1 OFFSET $2`, [limit, offset]);
    res.json({ page, limit, total, data: dataRes.rows });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});
router.get('/search', async (req, res) => {
  try {
    const { title, cuisine } = req.query;
    const ratingOp = parseComparator(req.query.rating);
    const timeOp = parseComparator(req.query.total_time);
    const caloriesOp = parseComparator(req.query.calories);
    const where = []; const params = [];
    if (title) { params.push(`%${title}%`); where.push(`LOWER(title) LIKE LOWER($${params.length})`); }
    if (cuisine) { params.push(cuisine); where.push(`cuisine = $${params.length}`); }
    if (ratingOp) { params.push(ratingOp.value); where.push(`rating ${ratingOp.op} $${params.length}`); }
    if (timeOp) { params.push(timeOp.value); where.push(`total_time ${timeOp.op} $${params.length}`); }
    if (caloriesOp) { params.push(caloriesOp.value); where.push(`(nutrients->>'calories')::numeric ${caloriesOp.op} $${params.length}`); }
    const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const sql = `SELECT * FROM recipes ${whereSql} ORDER BY rating DESC NULLS LAST, id ASC LIMIT 200`;
    const dataRes = await query(sql, params);
    res.json({ data: dataRes.rows });
  } catch (err) { console.error(err); res.status(400).json({ error: 'Invalid query parameters' }); }
});
export default router;
