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

app.get("/api/food/diag2", async (_req, res) => {
  try {
    const [[meta]] = await pool.query(`
      SELECT
        DATABASE() AS db_name,
        CURRENT_USER() AS sql_user,
        @@version AS mysql_version,
        @@hostname AS mysql_host,
        @@lower_case_table_names AS lower_case_table_names
    `);

    const [tables] = await pool.query(`
      SELECT TABLE_NAME
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      ORDER BY TABLE_NAME
    `);

    // helper: check one table
    const check = async (tbl) => {
      const out = { table: tbl, exists: false, count: null, error: null };
      try {
        const [erows] = await pool.query(`
          SELECT COUNT(*) AS n
          FROM information_schema.tables
          WHERE table_schema = DATABASE() AND table_name = ?
        `, [tbl]);
        out.exists = Number(erows[0].n) > 0;
        if (out.exists) {
          const [[c]] = await pool.query(`SELECT COUNT(*) AS n FROM \`${tbl}\``);
          out.count = Number(c.n);
        }
      } catch (e) {
        out.error = e.message;
      }
      return out;
    };

    const wordle = await check("wordle_seed");
    const teen   = await check("food_swaps_teen_fun");

    res.json({
      ok: true,
      meta,
      env_db_name: process.env.DB_NAME || null,
      tables_in_current_db: tables.map(t => t.TABLE_NAME),
      checks: { wordle, teen }
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API listening on :${port}`));
