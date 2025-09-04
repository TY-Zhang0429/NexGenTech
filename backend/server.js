import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(cors());             // TODO: lock to your frontend origin later
app.use(express.json());

// resolve __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// serve your images: http://host:port/food_icons/<Name>.png
app.use("/food_icons", express.static(path.join(__dirname, "food_icons")));

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

const DB = process.env.DB_NAME; // reuse everywhere

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

// ---------- TEEN SWAPS (uses <DB>.food_swaps_teen_fun) ----------
// PICTURED teen swaps: grouped JSON; from_img/to_img == names
app.get("/api/swaps-pics-teen", async (req, res) => {
  try {
    const { category, from } = req.query;

    let sql = `
      SELECT
        category,
        from_name_short AS from_food,
        from_name_short AS from_img,
        CAST(
          CONCAT(
            '[',
            GROUP_CONCAT(
              JSON_OBJECT(
                'to_img', to_name_short,
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
      WHERE 1=1
    `;
    const params = [];
    if (category) { sql += " AND category = ?"; params.push(String(category)); }
    if (from)     { sql += " AND from_name_short LIKE ?"; params.push(`%${String(from)}%`); }
    sql += " GROUP BY category, from_name_short ORDER BY category, from_name_short";

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// quick DB sanity (counts your teen table)
app.get("/api/food/db-test", async (_req, res) => {
  try {
    const [[row]] = await pool.query(`SELECT COUNT(*) AS count FROM \`${DB}\`.food_swaps_teen_fun`);
    res.json({ message: "OK", db: DB, count: Number(row.count) });
  } catch (e) {
    const [[meta]] = await pool.query("SELECT DATABASE() AS db");
    res.status(500).json({ error: e.message, connected_db: meta.db || null, env_db: DB });
  }
});

// ---------- START ----------
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API listening on :${port}`));
