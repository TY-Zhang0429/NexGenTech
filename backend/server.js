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

app.get("/api/swaps-teen/grouped", async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        category,
        from_name_short AS from_food,
        CAST(
          CONCAT(
            '[',
            GROUP_CONCAT(
              JSON_OBJECT(
                'to_food', to_name_short,
                'reason_tag', reason_tag,
                'rationale_short', rationale_short
              )
              ORDER BY to_name_short SEPARATOR ','
            ),
            ']'
          ) AS JSON
        ) AS swaps
      FROM food_swaps_teen_fun
      GROUP BY category, from_name_short
      ORDER BY category, from_name_short
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/food/db-test", async (_req, res) => {
  try {
    const [[row]] = await pool.query("SELECT COUNT(*) AS count FROM food_swaps_teen_fun");
    res.json({
      message: "Database connection successful",
      count: Number(row.count),
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error("DB TEST ERROR:", e);
    const [[meta]] = await pool.query("SELECT DATABASE() AS db");
    res.status(500).json({ error: e.message, db: meta.db || null });
  }
});

// Deep DB diag: shows current DB, lists tables, tests counts
app.get("/api/food/diag", async (_req, res) => {
  try {
    const [[meta]] = await pool.query(`
      SELECT DATABASE() AS db_name, CURRENT_USER() AS sql_user, @@hostname AS mysql_host, @@version AS mysql_version
    `);

    // list tables in the *current* schema
    const [tables] = await pool.query(`
      SELECT TABLE_NAME
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      ORDER BY TABLE_NAME
    `);

    // Try unqualified count
    let unqualified = { ok: false, error: null, count: null };
    try {
      const [[c1]] = await pool.query(`SELECT COUNT(*) AS cnt FROM food_swaps_teen_fun`);
      unqualified = { ok: true, count: Number(c1.cnt) };
    } catch (e) {
      unqualified = { ok: false, error: e.message };
    }

    // Try fully-qualified count using env DB_NAME (handles wrong default schema)
    let qualified = { ok: false, error: null, count: null };
    try {
      const dbName = process.env.DB_NAME;
      const sql = `SELECT COUNT(*) AS cnt FROM \`${dbName}\`.food_swaps_teen_fun`;
      const [[c2]] = await pool.query(sql);
      qualified = { ok: true, count: Number(c2.cnt) };
    } catch (e) {
      qualified = { ok: false, error: e.message };
    }

    res.json({
      ok: true,
      meta,
      env_db_name: process.env.DB_NAME || null,
      tables_in_current_db: tables.map(t => t.TABLE_NAME),
      tests: { unqualified, qualified }
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});



const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API listening on :${port}`));
