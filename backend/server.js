import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const app = express();
app.use(cors());             // later restrict to your frontend domain
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  // ssl: { /* add RDS CA later if you want TLS */ }
});

// health check
app.get("/api/health", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS ok");
    res.json({ ok: true, db: rows[0].ok });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// example data route
app.get("/api/words", async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT word, difficulty, hint
  FROM (
    SELECT s.word, s.difficulty, s.hint,
           CASE s.difficulty
             WHEN 'easy'   THEN (@e:=@e+1)
             WHEN 'medium' THEN (@m:=@m+1)
             WHEN 'hard'   THEN (@h:=@h+1)
           END AS rn
    FROM (SELECT @e:=0, @m:=0, @h:=0) vars,
         (SELECT word, difficulty, hint
            FROM wordle_seed
           WHERE difficulty IN ('easy','medium','hard')
           ORDER BY RAND()
         ) s
  ) ranked
  ORDER BY
    CASE WHEN difficulty='easy'   AND rn=1 THEN 1
         WHEN difficulty='medium' AND rn=1 THEN 1
         WHEN difficulty='hard'   AND rn=1 THEN 1
         ELSE 2
    END,
    RAND()
  LIMIT 20
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/swaps/grouped-sql", async (req, res) => {
  const { from_code, from } = req.query;

  let sql = `
    SELECT
      from_code,
      to_code,
      from_name_short AS from_food,
      to_name_short AS to_food,
      from_img,
      to_img,
      reason_tag,
      rationale_short
    FROM food_swaps_curated
  `;
  
  const params = [];
  const conditions = [];
  
  if (from_code) { 
    conditions.push("from_code = ?"); 
    params.push(String(from_code)); 
  }
  if (from) { 
    conditions.push("from_name_short LIKE ?"); 
    params.push(`%${String(from)}%`); 
  }
  
  if (conditions.length > 0) {
    sql += " WHERE " + conditions.join(" AND ");
  }
  
  sql += " ORDER BY from_name_short, to_name_short";

  try {
    const [rows] = await pool.query(sql, params);
    
    // Group the results by from_food
    const grouped = {};
    rows.forEach(row => {
      if (!grouped[row.from_code]) {
        grouped[row.from_code] = {
          from_code: row.from_code,
          from_food: row.from_food,
          from_img: row.from_img,
          swaps: []
        };
      }
      
      grouped[row.from_code].swaps.push({
        to_code: row.to_code,
        to_food: row.to_food,
        to_img: row.to_img,
        reason_tag: row.reason_tag,
        rationale_short: row.rationale_short
      });
    });
    
    res.json(Object.values(grouped));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API listening on :${port}`));
