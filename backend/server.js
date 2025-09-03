import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const app = express();
app.use(cors());             // TODO: lock to your frontend origin later
app.use(express.json());

// ---------- DB POOL ----------
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,     // must be EXACT, e.g. epic2_swaps
  waitForConnections: true,
  connectionLimit: 10,
  // ssl: { /* add RDS CA here if you enable TLS */ }
});

// Log the DB we actually connected to (sanity check)
(async () => {
  try {
    const [[info]] = await pool.query(
      "SELECT DATABASE() AS db, CURRENT_USER() AS user, @@version AS version"
    );
    console.log("[DB] connected to:", info.db, "as", info.user, "mysql", info.version);
  } catch (e) {
    console.error("[DB] startup check failed:", e.message);
  }
})();

// ---------- HEALTH ----------
app.get("/api/health", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS ok");
    res.json({ ok: true, db: rows[0].ok });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ---------- SAMPLE (unchanged) ----------
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

// ---------- TEEN SWAPS (uses epic2_swaps.food_swaps_teen_fun) ----------
const DB = process.env.DB_NAME; // e.g. "epic2_swaps" (must match exactly)

// flat rows (optional)
app.get("/api/swaps-teen", async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id,
             category,
             from_name_short AS from_food,
             to_name_short   AS to_food,
             reason_tag,
             rationale_short
      FROM \`${DB}\`.food_swaps_teen_fun
      ORDER BY category, from_food, to_food
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message, hint: "check DB_NAME + table name" });
  }
});

// grouped JSON (portable: uses GROUP_CONCAT -> JSON)
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
      FROM \`${DB}\`.food_swaps_teen_fun
      GROUP BY category, from_name_short
      ORDER BY category, from_name_short
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message, hint: "ensure table exists in DB_NAME" });
  }
});

// ---------- DIAGNOSTICS ----------
app.get("/api/food/db-test", async (_req, res) => {
  try {
    const [[row]] = await pool.query(
      `SELECT COUNT(*) AS count FROM \`${DB}\`.food_swaps_teen_fun`
    );
    res.json({ message: "OK", db: DB, count: Number(row.count) });
  } catch (e) {
    const [[meta]] = await pool.query("SELECT DATABASE() AS db");
    res.status(500).json({ error: e.message, connected_db: meta.db || null, env_db: DB });
  }
});

// deeper diag: lists tables + checks specific tables
app.get("/api/food/diag2", async (_req, res) => {
  try {
    const [[meta]] = await pool.query(`
      SELECT DATABASE() AS db_name, CURRENT_USER() AS sql_user, @@version AS mysql_version,
             @@hostname AS mysql_host, @@lower_case_table_names AS lower_case_table_names
    `);
    const [tables] = await pool.query(`
      SELECT TABLE_NAME
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      ORDER BY TABLE_NAME
    `);

    const check = async (tbl) => {
      const out = { table: tbl, exists: false, count: null, error: null };
      try {
        const [erows] = await pool.query(
          `SELECT COUNT(*) AS n
             FROM information_schema.tables
            WHERE table_schema = DATABASE() AND table_name = ?`,
          [tbl]
        );
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
      env_db_name: DB || null,
      tables_in_current_db: tables.map(t => t.TABLE_NAME),
      checks: { wordle, teen }
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ---------- START ----------
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API listening on :${port}`));
