import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

dotenv.config();

const app = express();
app.use(cors());             // TODO: lock to your frontend origin later
app.use(express.json());

// resolve __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// serve your images: http://host:port/food_icons/<Name>.png
app.use("/food_icons", express.static(path.join(__dirname, "food_icons")));

// API-only server - no frontend serving

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
    console.log("[DB] Attempting connection with:", {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      database: process.env.DB_NAME
    });
    
    const [[info]] = await pool.query(
      "SELECT DATABASE() AS db, CURRENT_USER() AS user, @@version AS version"
    );
    console.log("[DB] connected to:", info.db, "as", info.user, "mysql", info.version);
  } catch (e) {
    console.error("[DB] startup check failed:", e.message);
    console.error("[DB] Error details:", e);
    console.error("[DB] Environment check:", {
      DB_HOST: process.env.DB_HOST ? "SET" : "MISSING",
      DB_PORT: process.env.DB_PORT ? "SET" : "MISSING", 
      DB_USER: process.env.DB_USER ? "SET" : "MISSING",
      DB_NAME: process.env.DB_NAME ? "SET" : "MISSING",
      DB_PASS: process.env.DB_PASS ? "SET" : "MISSING"
    });
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

// ========== RECIPE ENDPOINTS FOR TEEN NUTRITION APP ==========
// Updated to match your actual database schema
// Add these endpoints to your existing server.js file

// ---------- RECIPE FILTERING & DISCOVERY ----------

// GET /api/recipes/filters - Get all available filter options
app.get("/api/recipes/filters", async (_req, res) => {
  try {
    // Get distinct categories from both tables
    const [categories] = await pool.query(`
      SELECT category, COUNT(*) as count FROM (
        SELECT DISTINCT category FROM \`${DB}\`.recipes 
        UNION ALL 
        SELECT DISTINCT category FROM \`${DB}\`.teen_recipes
      ) combined
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY category
    `);

    // Get prep time ranges from recipes table
    const [prepTimes] = await pool.query(`
      SELECT 
        CASE 
          WHEN (prep_time_minutes + COALESCE(cook_time_minutes, 0)) <= 5 THEN '0-5'
          WHEN (prep_time_minutes + COALESCE(cook_time_minutes, 0)) <= 15 THEN '5-15'
          WHEN (prep_time_minutes + COALESCE(cook_time_minutes, 0)) <= 30 THEN '15-30'
          ELSE '30+'
        END as time_range,
        COUNT(*) as count
      FROM \`${DB}\`.recipes 
      WHERE prep_time_minutes IS NOT NULL
      GROUP BY time_range
      ORDER BY MIN(prep_time_minutes + COALESCE(cook_time_minutes, 0))
    `);

    // Get calorie ranges from both tables
    const [calorieRanges] = await pool.query(`
      SELECT 
        MIN(calories) as min_calories,
        MAX(calories) as max_calories,
        AVG(calories) as avg_calories
      FROM (
        SELECT calories FROM \`${DB}\`.recipes WHERE calories IS NOT NULL
        UNION ALL
        SELECT calories FROM \`${DB}\`.teen_recipes WHERE calories IS NOT NULL
      ) combined
    `);

    // Get available ingredients from recipes.ingredients JSON column
    const [ingredientData] = await pool.query(`
      SELECT ingredients 
      FROM \`${DB}\`.recipes 
      WHERE ingredients IS NOT NULL
    `);

    console.log('Raw ingredient data rows:', ingredientData.length);
    if (ingredientData.length > 0) {
      console.log('First ingredient row:', ingredientData[0]);
    }

    // Extract unique ingredients from JSON
    const allIngredients = new Set();
    ingredientData.forEach(row => {
      try {
        let ingredients;
        
        // Check if it's already a JavaScript array (not JSON string)
        if (Array.isArray(row.ingredients)) {
          ingredients = row.ingredients;
        } else {
          // Try to parse as JSON string
          ingredients = JSON.parse(row.ingredients);
        }
        
        console.log('Parsed ingredients for debugging:', ingredients);
        
        if (Array.isArray(ingredients)) {
          ingredients.forEach(ing => {
            if (typeof ing === 'string') {
              allIngredients.add(ing);
            } else if (ing && ing.name) {
              allIngredients.add(ing.name);
            }
          });
        }
      } catch (e) {
        console.log('Error parsing ingredients:', e.message, row.ingredients);
        // Skip invalid JSON
      }
    });

    console.log('Total ingredients found:', allIngredients.size);
    console.log('Sample ingredients:', Array.from(allIngredients).slice(0, 10));

    res.json({
      categories: categories.map(c => ({
        name: c.category,
        count: c.count,
        emoji: getCategoryEmoji(c.category)
      })),
      prepTimeRanges: prepTimes.map(t => ({
        range: t.time_range,
        count: t.count,
        label: getTimeLabel(t.time_range)
      })),
      calorieRange: {
        min: Math.floor(calorieRanges[0]?.min_calories || 0),
        max: Math.ceil(calorieRanges[0]?.max_calories || 800),
        average: Math.round(calorieRanges[0]?.avg_calories || 300)
      },
      ingredients: Array.from(allIngredients).sort()
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/recipes/search - Main recipe search with filters
app.get("/api/recipes/search", async (req, res) => {
  try {
    const {
      category,           // breakfast, snack, lunch, dinner, dessert
      prepTime,          // 0-5, 5-15, 15-30, 30+
      caloriesMin,       // minimum calories
      caloriesMax,       // maximum calories
      ingredients,       // comma-separated ingredient names
      page = 1,          // pagination
      limit = 12,        // recipes per page
      sortBy = 'popularity' // popularity, prep_time, calories, newest
    } = req.query;

    // Search both tables and combine results
    let recipesQuery = `
      SELECT 
        CONCAT('recipe_', r.id) as unique_id,
        'recipes' as source_table,
        r.id,
        r.title as recipe_name,
        r.title as teen_name,
        r.category,
        r.calories,
        r.protein_g,
        r.carbs_g,
        r.fat_g,
        r.fiber_g,
        r.serving_size,
        r.prep_time_minutes,
        r.cook_time_minutes,
        (r.prep_time_minutes + COALESCE(r.cook_time_minutes, 0)) as total_time,
        r.servings,
        r.measurements,
        r.directions,
        r.ingredients,
        r.created_at,
        r.title as image_filename
      FROM \`${DB}\`.recipes r
      WHERE 1=1
    `;

    let teenRecipesQuery = `
      SELECT 
        CONCAT('teen_', tr.id) as unique_id,
        'teen_recipes' as source_table,
        tr.id,
        tr.recipe_name,
        tr.recipe_name as teen_name,
        tr.category,
        tr.calories,
        tr.protein_g,
        tr.carbs_g,
        tr.fat_g,
        tr.fiber_g,
        tr.serving_size,
        NULL as prep_time_minutes,
        NULL as cook_time_minutes,
        NULL as total_time,
        NULL as servings,
        NULL as measurements,
        NULL as directions,
        NULL as ingredients,
        tr.created_at,
        tr.recipe_name as image_filename
      FROM \`${DB}\`.teen_recipes tr
      WHERE 1=1
    `;

    const params = [];
    const teenParams = [];

    // Apply filters to both queries
    if (category) {
      recipesQuery += " AND r.category = ?";
      teenRecipesQuery += " AND tr.category = ?";
      params.push(category);
      teenParams.push(category);
    }

    if (prepTime) {
      const timeCondition = getTimeCondition(prepTime);
      if (timeCondition) {
        recipesQuery += ` AND ${timeCondition}`;
        // teen_recipes doesn't have time info, so exclude from time filtering
      }
    }

    if (caloriesMin) {
      recipesQuery += " AND r.calories >= ?";
      teenRecipesQuery += " AND tr.calories >= ?";
      params.push(Number(caloriesMin));
      teenParams.push(Number(caloriesMin));
    }

    if (caloriesMax) {
      recipesQuery += " AND r.calories <= ?";
      teenRecipesQuery += " AND tr.calories <= ?";
      params.push(Number(caloriesMax));
      teenParams.push(Number(caloriesMax));
    }

    if (ingredients) {
      const ingredientList = ingredients.split(',').map(i => i.trim());
      const ingredientConditions = ingredientList.map(() => "r.ingredients LIKE ?").join(" AND ");
      recipesQuery += ` AND (${ingredientConditions})`;
      ingredientList.forEach(ingredient => {
        params.push(`%"${ingredient}"%`);
      });
      // teen_recipes doesn't have ingredients column, so exclude from ingredient filtering
    }

    // Combine both queries with duplicate handling
    let combinedQuery = `
      SELECT * FROM (
        (${recipesQuery})
        UNION ALL
        (${teenRecipesQuery})
      ) combined
      WHERE NOT EXISTS (
        SELECT 1 FROM \`${DB}\`.recipes r2 
        WHERE r2.title = combined.recipe_name 
        AND combined.source_table = 'teen_recipes'
      )
    `;

    // Apply sorting
    const sortCondition = getSortCondition(sortBy);
    combinedQuery += ` ORDER BY ${sortCondition}`;

    // Apply pagination
    const offset = (Number(page) - 1) * Number(limit);
    combinedQuery += " LIMIT ? OFFSET ?";

    const allParams = [...params, ...teenParams, Number(limit), offset];
    const [recipes] = await pool.query(combinedQuery, allParams);

    // Get total count for pagination with duplicate handling
    let countQuery = `
      SELECT COUNT(*) as total FROM (
        (${recipesQuery})
        UNION ALL
        (${teenRecipesQuery})
      ) combined
      WHERE NOT EXISTS (
        SELECT 1 FROM \`${DB}\`.recipes r2 
        WHERE r2.title = combined.recipe_name 
        AND combined.source_table = 'teen_recipes'
      )
    `;
    const countParams = [...params, ...teenParams];
    const [countResult] = await pool.query(countQuery, countParams);

    // Process results
    const processedRecipes = recipes.map(recipe => ({
      ...recipe,
      measurements: safeJsonParse(recipe.measurements),
      directions: safeJsonParse(recipe.directions),
      ingredients: safeJsonParse(recipe.ingredients),
      image_url: `/food_icons/${recipe.image_filename}`,
      time_display: formatTimeDisplay(recipe.prep_time_minutes, recipe.cook_time_minutes),
      nutrition_summary: {
        calories: recipe.calories,
        protein: recipe.protein_g,
        carbs: recipe.carbs_g,
        fat: recipe.fat_g,
        fiber: recipe.fiber_g
      }
    }));

    res.json({
      recipes: processedRecipes,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / Number(limit))
      }
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/recipes/:source/:id - Get full recipe details with measurements and directions
app.get("/api/recipes/:source/:id", async (req, res) => {
  try {
    const { source, id } = req.params; // source: 'recipes' or 'teen_recipes'

    let query, tableName;
    if (source === 'recipes') {
      tableName = 'recipes';
      query = `
        SELECT 
          id,
          title as recipe_name,
          title as teen_name,
          category,
          calories,
          protein_g,
          carbs_g,
          fat_g,
          fiber_g,
          serving_size,
          prep_time_minutes,
          cook_time_minutes,
          (prep_time_minutes + COALESCE(cook_time_minutes, 0)) as total_time,
          servings,
          measurements,
          directions,
          ingredients,
          created_at,
          updated_at,
          title as image_filename
        FROM \`${DB}\`.recipes 
        WHERE id = ?
      `;
    } else if (source === 'teen_recipes') {
      tableName = 'teen_recipes';
      query = `
        SELECT 
          id,
          recipe_name,
          recipe_name as teen_name,
          category,
          calories,
          protein_g,
          carbs_g,
          fat_g,
          fiber_g,
          serving_size,
          NULL as prep_time_minutes,
          NULL as cook_time_minutes,
          NULL as total_time,
          NULL as servings,
          NULL as measurements,
          NULL as directions,
          NULL as ingredients,
          created_at,
          updated_at,
          recipe_name as image_filename
        FROM \`${DB}\`.teen_recipes 
        WHERE id = ?
      `;
    } else {
      return res.status(400).json({ error: "Invalid source. Use 'recipes' or 'teen_recipes'" });
    }

    const [results] = await pool.query(query, [id]);

    if (results.length === 0) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    const recipe = results[0];

    // Format the response
    const fullRecipe = {
      ...recipe,
      source_table: tableName,
      measurements: safeJsonParse(recipe.measurements),
      directions: safeJsonParse(recipe.directions),
      ingredients: safeJsonParse(recipe.ingredients),
      image_url: `/food_icons/${recipe.image_filename}`,
      
      // Teen-friendly display formatting
      display: {
        time_display: formatTimeDisplay(recipe.prep_time_minutes, recipe.cook_time_minutes),
        serving_text: recipe.servings ? `Makes ${recipe.servings} ${recipe.servings === 1 ? 'serving' : 'servings'}` : 'Serving size varies',
        calorie_text: recipe.calories ? `${recipe.calories} calories per serving` : 'Calories vary',
        nutrition_bar: {
          protein: recipe.protein_g || 0,
          carbs: recipe.carbs_g || 0,
          fat: recipe.fat_g || 0,
          fiber: recipe.fiber_g || 0
        }
      }
    };

    res.json(fullRecipe);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/recipes/popular - Get most popular recipes (from both tables)
app.get("/api/recipes/popular", async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const query = `
      SELECT * FROM (
        SELECT 
          CONCAT('recipe_', id) as unique_id,
          'recipes' as source_table,
          id,
          title as recipe_name,
          category,
          calories,
          (prep_time_minutes + COALESCE(cook_time_minutes, 0)) as total_time,
          title as image_filename,
          created_at,
          1 as priority
        FROM \`${DB}\`.recipes
        WHERE calories IS NOT NULL
        
        UNION ALL
        
        SELECT 
          CONCAT('teen_', id) as unique_id,
          'teen_recipes' as source_table,
          id,
          recipe_name,
          category,
          calories,
          NULL as total_time,
          recipe_name as image_filename,
          created_at,
          2 as priority
        FROM \`${DB}\`.teen_recipes
        WHERE calories IS NOT NULL
      ) combined
      ORDER BY priority ASC, created_at DESC
      LIMIT ?
    `;

    const [recipes] = await pool.query(query, [Number(limit)]);

    const processedRecipes = recipes.map(recipe => ({
      ...recipe,
      image_url: `/food_icons/${recipe.image_filename}`,
      time_display: recipe.total_time ? formatTimeDisplay(recipe.total_time, 0) : 'Quick prep'
    }));

    res.json(processedRecipes);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/recipes/:source/:id/favorite - Toggle favorite status
app.post("/api/recipes/:source/:id/favorite", async (req, res) => {
  try {
    const { source, id } = req.params;
    const { action = 'toggle' } = req.body;

    // For now, just return success
    // In a real app, you'd store this in a user_favorites table
    res.json({ 
      success: true, 
      favorited: action === 'add',
      recipe_id: `${source}_${id}`
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/recipes/quick-stats - Get database statistics
app.get("/api/recipes/quick-stats", async (_req, res) => {
  try {
    const [recipeCount] = await pool.query(`SELECT COUNT(*) as count FROM \`${DB}\`.recipes`);
    const [teenRecipeCount] = await pool.query(`SELECT COUNT(*) as count FROM \`${DB}\`.teen_recipes`);
    
    const [categoryStats] = await pool.query(`
      SELECT category, COUNT(*) as count FROM (
        SELECT category FROM \`${DB}\`.recipes WHERE category IS NOT NULL
        UNION ALL
        SELECT category FROM \`${DB}\`.teen_recipes WHERE category IS NOT NULL
      ) combined
      GROUP BY category
      ORDER BY count DESC
    `);

    res.json({
      total_recipes: recipeCount[0].count,
      total_teen_recipes: teenRecipeCount[0].count,
      total_combined: recipeCount[0].count + teenRecipeCount[0].count,
      categories: categoryStats
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------- HELPER FUNCTIONS ----------

function getCategoryEmoji(category) {
  const emojiMap = {
    'breakfast': '🌅',
    'snack': '🍿',
    'lunch': '🥙',
    'dinner': '🍽️',
    'dessert': '🍰',
    'beverage': '🥤',
    'drink': '🥤'
  };
  return emojiMap[category?.toLowerCase()] || '🍽️';
}

function getTimeLabel(timeRange) {
  const labelMap = {
    '0-5': 'Super Quick',
    '5-15': 'Quick Prep',
    '15-30': 'Some Time',
    '30+': 'Weekend Project'
  };
  return labelMap[timeRange] || timeRange;
}

function getTimeCondition(prepTime) {
  const conditionMap = {
    '0-5': '(r.prep_time_minutes + COALESCE(r.cook_time_minutes, 0)) <= 5',
    '5-15': '(r.prep_time_minutes + COALESCE(r.cook_time_minutes, 0)) > 5 AND (r.prep_time_minutes + COALESCE(r.cook_time_minutes, 0)) <= 15',
    '15-30': '(r.prep_time_minutes + COALESCE(r.cook_time_minutes, 0)) > 15 AND (r.prep_time_minutes + COALESCE(r.cook_time_minutes, 0)) <= 30',
    '30+': '(r.prep_time_minutes + COALESCE(r.cook_time_minutes, 0)) > 30'
  };
  return conditionMap[prepTime];
}

function getSortCondition(sortBy) {
  const sortMap = {
    'popularity': 'created_at DESC', // Most recent first since we don't have view counts
    'prep_time': 'total_time ASC, calories ASC',
    'calories': 'calories ASC',
    'newest': 'created_at DESC',
    'protein': 'protein_g DESC'
  };
  return sortMap[sortBy] || sortMap['popularity'];
}

function safeJsonParse(jsonString) {
  if (!jsonString) return null;
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return jsonString; // Return as string if not valid JSON
  }
}

function formatTimeDisplay(prepTime, cookTime) {
  const total = (prepTime || 0) + (cookTime || 0);
  if (total <= 0) return 'Time varies';
  
  if (prepTime && cookTime) {
    return `${prepTime}min prep + ${cookTime}min cook`;
  } else if (total <= 5) {
    return `${total}min - Super quick!`;
  } else if (total <= 15) {
    return `${total}min - Quick & easy`;
  } else if (total <= 30) {
    return `${total}min - Worth the time`;
  } else {
    return `${total}min - Weekend project`;
  }
}

// ---------- START ----------
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API listening on :${port}`));
