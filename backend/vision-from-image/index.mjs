// filename: index.mjs
// Runtime: Node.js 20.x

import fs from "fs";
import { RekognitionClient, DetectLabelsCommand } from "@aws-sdk/client-rekognition";

// ===== Edge Header Verification =====
const EDGE_SECRET = process.env.EDGE_SECRET;
function isFromEdge(headers = {}) {
  const val =
    headers["XEdgeAuth"] ||
    headers["xedgeauth"] ||
    headers["X-Edge-Auth"] ||
    headers["x-edge-auth"];
  return EDGE_SECRET && val === EDGE_SECRET;
}


const RENDER_API_BASE = "https://nexgentech-api.onrender.com";
const HF_SIM_MODELS =
  "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2";

/* ================== Rekognition v3 client ================== */
const REKO_REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const rekClient = new RekognitionClient({ region: REKO_REGION });

/* **********************************************************************************************
 * *************** SECTION A: BAN LIST (generic scene/tableware etc.) ****************************
 * **********************************************************************************************/
const GENERIC_LABELS = new Set([
  "food","produce","plant","meal","dish","ingredient","cuisine","natural foods","nutrition","grocery",
  "organic food","freshness","healthy food","cup","lunch","fruit","ammunition","ball","sport","grenade",
  "weapon","cricket ball","cricket","birthday cake","person","chopping board","blade","knife","cooking",
  "brunch","breakfast","dinner","snacks","plate","furniture","dining table","table","snack","bowl",
  "cafeteria","indoor","restaurant","platter","spoon","candle","cutlery","tableware","kitchen utensil",
  "glass","fork","napkin","saucer","tray","countertop","oven","stove","pan","pot","baking","appliance"
]);

/* **********************************************************************************************
 * *************** SECTION B: INGREDIENT WHITELIST + ALIASES (ONLY KEEP THESE) ******************
 * **********************************************************************************************
 * WHY: Rekognition may output dishes/scenes. We enforce "ingredients-only" by intersecting
 *      with a controlled whitelist (plus simple alias normalization).
 */
const INGREDIENT_WHITELIST = new Set([
  // Vegetables / Fruits
  "tomato","onion","garlic","ginger","carrot","potato","broccoli","cabbage","spinach","lettuce",
  "cucumber","eggplant","zucchini","mushroom","bell pepper","pepper","chili","corn","peas","pumpkin",
  "cauliflower","asparagus","beetroot","celery","kale","leek","okra","radish","sweet potato",
  "avocado","apple","banana","orange","lemon","lime","strawberry","blueberry","grape","pineapple",
  "mango","watermelon","peach","pear","kiwi",

  // Proteins / Eggs / Seafood
  "chicken","beef","pork","lamb","turkey","duck","ham","bacon","sausage","egg",
  "fish","salmon","tuna","shrimp","prawn","crab","lobster","mussel","clam","octopus","squid",

  // Dairy
  "milk","butter","cheese","yogurt","cream","parmesan","mozzarella",

  // Grains / Staples
  "rice","brown rice","quinoa","oats","wheat","barley","flour","noodles","pasta","bread","tortilla",

  // Legumes / Nuts / Seeds
  "tofu","soybean","edamame","chickpeas","lentils","kidney beans","black beans",
  "peanuts","almonds","walnuts","cashews","hazelnuts","pistachios",
  "sesame","chia seeds","flaxseed","sunflower seeds","pumpkin seeds",

  // Herbs / Spices / Seasonings
  "basil","parsley","cilantro","coriander","mint","rosemary","thyme","oregano","dill","chives","bay leaf",
  "cinnamon","clove","nutmeg","star anise","cumin","turmeric","paprika","black pepper","white pepper",
  "sichuan peppercorn","ginger powder","garam masala","five spice","curry powder","salt","sugar",
  "brown sugar","honey","maple syrup","soy sauce","vinegar","balsamic vinegar","olive oil","sesame oil",

  // Others / Pantry
  "coconut","coconut milk","tomato paste","tomato sauce","ketchup","mayonnaise","mustard","pickles",
]);

// Simple aliases / singularization (very light-weight; no external lib)
const ALIASES = new Map([
  ["bell peppers","bell pepper"],
  ["red pepper","bell pepper"], ["green pepper","bell pepper"], ["capsicum","bell pepper"],
  ["chilies","chili"], ["chilli","chili"], ["chiles","chili"],
  ["tomatoes","tomato"], ["potatoes","potato"], ["mushrooms","mushroom"],
  ["eggs","egg"], ["noodle","noodles"],
  ["prawns","shrimp"], ["shrimps","shrimp"],
  ["scallion","chives"], ["spring onion","chives"],
  ["cilantro","coriander"], // American ↔ British naming
  ["bell_pepper","bell pepper"], ["kidney bean","kidney beans"], ["black bean","black beans"],
]);

function normKey(s = "") {
  const k = String(s).toLowerCase().replace(/_/g, " ").trim();
  if (ALIASES.has(k)) return ALIASES.get(k);
  // naive singularization for trailing 's'
  if (k.endsWith("s") && INGREDIENT_WHITELIST.has(k.slice(0, -1))) return k.slice(0, -1);
  return k;
}

/* ================== local vector index ================== */
let VEC_INDEX = null;
const INDEX_PATH = "./recipes-embeddings.json";
function loadIndexOnce() {
  if (VEC_INDEX) return VEC_INDEX;
  try {
    const raw = fs.readFileSync(INDEX_PATH, "utf-8");
    VEC_INDEX = JSON.parse(raw);
    console.log("[sim] index loaded:", Array.isArray(VEC_INDEX) ? VEC_INDEX.length : 0);
  } catch (e) {
    console.error("[sim] index not found:", e?.message);
    VEC_INDEX = null;
  }
  return VEC_INDEX;
}

/* ================== similarity search  ================== */
const SYN = {
  macarons: ["macaron", "macaroon", "rice cake","cake","birthday cake"],
  hamburger: ["burger", "cheeseburger"],
  pizza: ["margherita", "pepperoni"],
  cake: ["birthday cake","macaron"]
};
function buildQueryFromLabel(label) {
  const syn = (SYN[label?.toLowerCase()] || []).join(", ");
  return `Find recipes about ${label}. Related terms: ${syn}.`;
}
function toSentence(r) {
  if (r?.text) return r.text;
  const name = r?.recipe_name || "";
  const cat = r?.category || "";
  let ingLine = "";
  try {
    const arr = Array.isArray(r?.ingredients)
      ? r.ingredients
      : typeof r?.ingredients === "string"
      ? JSON.parse(r.ingredients)
      : [];
    const list = arr
      .map((x) => (typeof x === "string" ? x : x?.name || ""))
      .filter(Boolean)
      .slice(0, 10);
    if (list.length) ingLine = ` Ingredients: ${list.join(", ")}.`;
  } catch {}
  return `${name}. Category: ${cat}.${ingLine}`;
}
async function hfSimilarity(query, sentences, HF_TOKEN) {
  const headers = {
    Authorization: `Bearer ${HF_TOKEN}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Wait-For-Model": "true",
  };
  const body = JSON.stringify({
    inputs: { source_sentence: query, sentences },
    options: { wait_for_model: true },
  });
  const r = await fetch(HF_SIM_MODELS, { method: "POST", headers, body });
  const t = await r.text();
  if (!r.ok) throw new Error(`[models] ${r.status}: ${t.slice(0, 200)}`);
  let data;
  try { data = JSON.parse(t); } catch { throw new Error(`[models] non-JSON: ${t.slice(0, 200)}`); }
  return data;
}
async function semanticSearchBySimilarity(label, HF_TOKEN) {
  const index = loadIndexOnce();
  if (!index || !Array.isArray(index) || index.length === 0) return [];
  const query = buildQueryFromLabel(label);
  const sentences = index.map(toSentence);
  const scores = await hfSimilarity(query, sentences, HF_TOKEN);
  if (!Array.isArray(scores) || scores.length !== index.length) {
    throw new Error(`HF similarity unexpected shape: ${JSON.stringify(scores).slice(0, 200)}`);
  }
  const ranked = scores.map((sim, i) => ({ sim, r: index[i] })).sort((a, b) => b.sim - a.sim);
  const dessertHints = ["macaron","macarons","macaroon","dessert","cake","cookie"];
  const isDessert = dessertHints.some((k) => (label || "").toLowerCase().includes(k));
  const MIN_SIM = isDessert ? 0.30 : 0.35;
  const picked = ranked.filter((x) => x.sim >= MIN_SIM).slice(0, 3);
  if (!picked.length) return [];
  return picked.map(({ r }) => ({
    id: r.id,
    recipe_name: r.recipe_name,
    category: r.category,
    time_display: r.time_display,
    calories: r.calories,
    protein_g: r.protein_g,
    carbs_g: r.carbs_g,
    fat_g: r.fat_g,
    image_url: r.image_url || (r.image_filename ? `/food_icons/${r.image_filename}.png` : null),
  }));
}

/* **********************************************************************************************
 * *************** SECTION C: DETECTION (Rekognition) + INGREDIENT FILTER ***********************
 * **********************************************************************************************/

// *************** CALL: Rekognition DetectLabels (multi-label) ***************
async function detectFoodLabelsWithRekognition(buffer) {
  const cmd = new DetectLabelsCommand({
    Image: { Bytes: buffer },
    MaxLabels: 100,
    MinConfidence: 60, // low → we will filter after
  });
  const out = await rekClient.send(cmd);
  return out?.Labels || [];
}

/**
 * *************** STEP: Normalize + Coarse Filter (drop generic/scene) ***************
 * WHAT: Lowercase, dedup, drop GENERIC_LABELS and very-short tokens.
 */
function normalizeLabels(
  rekoLabels = [],
  {
    minConfidence = 65,
    maxLabels = 50,
    includeParents = false, 
    ban = GENERIC_LABELS     
  } = {}
) {
  const picked = [];

  for (const L of rekoLabels) {
    if ((L?.Confidence || 0) < minConfidence) continue;
    if (!L?.Name) continue;

    picked.push({ name: L.Name, conf: L.Confidence });

    if (includeParents && Array.isArray(L.Parents)) {
      for (const p of L.Parents) {
        if (p?.Name) picked.push({ name: p.Name, conf: L.Confidence - 1 });
      }
    }
  }

  const seen = new Map();
  for (const { name, conf } of picked) {
    const key = normKey(name);
    if (!key) continue;
    if (ban.has(key)) continue;       // drop generic/scene words
    if (key.length < 3) continue;

    const prev = seen.get(key)?.conf || 0;
    if (conf > prev) seen.set(key, { label: key, conf });
  }

  return Array.from(seen.values())
    .sort((a, b) => b.conf - a.conf)
    .slice(0, maxLabels);
}

/**
 * *************** STEP: Ingredients-Only Filter (whitelist + alias) ***************
 * WHAT: Enforce ingredients-only by intersecting with INGREDIENT_WHITELIST after alias normalization.
 */
function filterToIngredientsOnly(labels = [], { keepTopN = 15 } = {}) {
  const out = [];
  const seen = new Set();
  for (const x of labels) {
    const key = normKey(x.label);
    if (!key) continue;
    if (!INGREDIENT_WHITELIST.has(key)) continue;  // <-- the KEY line: enforce whitelist
    const id = `${key}`;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ label: key, conf: Math.round(x.conf) });
  }
  return out.slice(0, keepTopN);
}

/* ================== CORS ================== */
const ALLOWED_ORIGINS = new Set(["https://www.nexgentech.me", "http://localhost:5173"]);
function headers(origin) {
  const allow = ALLOWED_ORIGINS.has(origin) ? origin : "https://www.nexgentech.me";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
function resp(code, body, origin = "*") {
  return { statusCode: code, headers: headers(origin), body };
}
function json(code, obj, origin = "*") {
  return {
    statusCode: code,
    headers: { ...headers(origin), "Content-Type": "application/json" },
    body: JSON.stringify(obj),
  };
}

/* **********************************************************************************************
 * *************** SECTION D: MAIN HANDLER (DETECT → COMPARE → FALLBACK → RANK) *****************
 * **********************************************************************************************/

export const handler = async (event) => {
  try {
    const origin = event.headers?.origin || event.headers?.Origin || "*";
    if (!isFromEdge(event.headers || {})) {
      return json(403, { error: "Forbidden" }, origin);
    }    
    const method = event.requestContext?.http?.method || event.httpMethod;
    if (method === "OPTIONS") return resp(204, "", origin);
    if (method !== "POST")   return json(405, { error: "Method Not Allowed" }, origin);

    const isBase64 = !!event.isBase64Encoded;
    const body = event.body || "";
    const buf = Buffer.from(body, isBase64 ? "base64" : "utf8");
    const contentType =
      event.headers?.["content-type"] || event.headers?.["Content-Type"] || "application/octet-stream";

    // Rekognition supports JPEG/PNG (WebP not supported)
    if (!/^image\/(jpeg|png)$/i.test(contentType)) {
      return json(415, { error: "Only JPG/PNG allowed for Rekognition" }, origin);
    }
    if (buf.length > 5 * 1024 * 1024) {
      return json(413, { error: "Max 5MB" }, origin);
    }

    const HF_TOKEN = process.env.HF_TOKEN;
    if (!HF_TOKEN) return json(500, { error: "HF token not configured" }, origin);

    /* ------------------------------------------------------------------------------------------
     * *************** STEP 1: ********* DETECT ********* via Rekognition ************************
     * ---------------------------------------------------------------------------------------- */
    const rekoLabelsRaw = await detectFoodLabelsWithRekognition(buf);

    // *************** Normalize + drop generic ***************
    const normalized = normalizeLabels(rekoLabelsRaw, {
      minConfidence: 55,
      maxLabels: 40,
      includeParents: false,
      ban: GENERIC_LABELS
    });

    // *************** Enforce INGREDIENTS-ONLY (whitelist) ***************
    const labels = filterToIngredientsOnly(normalized, { keepTopN: 15 });

    console.log("[reko] normalized:", normalized);
    console.log("[filter] ingredients-only:", labels);

    if (!labels.length) return json(422, { error: "No recognizable ingredients in image" }, origin);

    /* ------------------------------------------------------------------------------------------
     * *************** STEP 2: ********* COMPARE ********* (Semantic Search) *********************
     * ---------------------------------------------------------------------------------------- */
    const merged = [];
    const seen = new Set();
    for (const { label } of labels) {
      try {
        const sims = await semanticSearchBySimilarity(label, HF_TOKEN);
        for (const r of sims) {
          const id = r?.id && String(r.id);
          if (!id || seen.has(id)) continue;
          seen.add(id);
          merged.push({ ...r, _matched_label: label });
        }
      } catch (e) {
        console.error("[sim] failed for", label, e?.message);
      }
    }

    /* ------------------------------------------------------------------------------------------
     * *************** STEP 3: FALLBACK (Render text search) ************************************
     * ---------------------------------------------------------------------------------------- */
    let candidates = merged;
    if (!candidates.length) {
      const primary = labels.map((l) => l.label).slice(0, 2);
      for (const term of primary) {
        try {
          const r1 = await fetch(`${RENDER_API_BASE}/api/recipes/search?q=${encodeURIComponent(term)}&limit=24`);
          if (r1.ok) {
            const arr = (await r1.json()).recipes || [];
            for (const r of arr) {
              const id = (r.id || r.unique_id) && String(r.id || r.unique_id);
              if (!id || seen.has(id)) continue;
              seen.add(id);
              candidates.push({
                id,
                recipe_name: r.recipe_name,
                category: r.category,
                time_display: r.time_display,
                calories: r.calories,
                protein_g: r.protein_g,
                carbs_g: r.carbs_g,
                fat_g: r.fat_g,
                image_url: r.image_url || (r.image_filename ? `/food_icons/${r.image_filename}.png` : null),
                _matched_label: term,
              });
            }
          }
        } catch {}
      }
    }

    /* ------------------------------------------------------------------------------------------
     * *************** STEP 4: RANK (protein density → kcal closeness) + RESPOND ****************
     * ---------------------------------------------------------------------------------------- */
    const proteinDensity = (r) => Number(r?.protein_g || 0) / Math.max(1, Number(r?.calories || 1));
    const kcalDiff = (r) => Math.abs(Number(r?.calories || 0) - 500);
    candidates.sort((a, b) => {
      const p = proteinDensity(b) - proteinDensity(a);
      if (p !== 0) return p;
      return kcalDiff(a) - kcalDiff(b);
    });
    const top3 = candidates.slice(0, 3);

    return json(200, { labels, candidates: top3 }, origin);
  } catch (e) {
    console.error(e);
    return json(500, { error: "server error" });
  }
};
