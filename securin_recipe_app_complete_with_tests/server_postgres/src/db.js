import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;
dotenv.config();
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export async function query(q, params = []) {
  const client = await pool.connect();
  try { const res = await client.query(q, params); return res; } finally { client.release(); }
}
