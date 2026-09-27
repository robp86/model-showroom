// Cost-calculator data build: Ryan's workbook -> the website's cost-ranges.json.
//
//   node scripts/build-cost-data.mjs <workbook.xlsx> [--reviewed] [--check-quotes] [--out <file>] [--site <dir>]
//
// --site defaults to ../Native Suns Homes LLC/native_sun_homes_updated_site
// (the funnel site folder); --out defaults to <site>/data/cost-ranges.json.
//
// The workbook (Native_Sun_Homes_Cost_Calculator_v2.xlsx) is the source of
// truth: edit its yellow cells, then re-run this. Output goes to the funnel
// site (nativesunhomes.com), which reads it from /data/cost-ranges.json.
//
//   --reviewed      mark the numbers as real. Without it the JSON is flagged
//                   placeholder:true and the page shows a "test numbers" banner.
//   --check-quotes  replay every filled-in row of the Past Quotes tab through
//                   the calculator and report where the ranges miss.
//
// No dependencies: .xlsx is a zip of XML, read here with node:zlib.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_SITE = path.resolve(ROOT, "..", "Native Suns Homes LLC", "native_sun_homes_updated_site");

const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const opt = (f) => (args.indexOf(f) >= 0 ? args[args.indexOf(f) + 1] : null);
const XLSX = args.find((a) => a.endsWith(".xlsx"));
if (!XLSX) {
  console.error("usage: node scripts/build-cost-data.mjs <workbook.xlsx> [--reviewed] [--check-quotes] [--out <file>]");
  process.exit(1);
}
const SITE = path.resolve(opt("--site") || DEFAULT_SITE);
const OUT = path.resolve(opt("--out") || path.join(SITE, "data", "cost-ranges.json"));

/* ------------------------------------------------------------ xlsx reading */

function unzip(buf) {
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new Error("not a zip/xlsx file");
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const files = {};
  for (let i = 0; i < count; i++) {
    const method = buf.readUInt16LE(p + 10), size = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28), extra = buf.readUInt16LE(p + 30), comment = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const raw = buf.subarray(start, start + size);
    files[name] = method === 8 ? zlib.inflateRawSync(raw) : raw;
    p += 46 + nameLen + extra + comment;
  }
  return files;
}

const decode = (s) =>
  s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");

function readWorkbook(file) {
  const z = unzip(fs.readFileSync(file));
  const text = (n) => (z[n] ? z[n].toString("utf8") : "");
  const shared = (text("xl/sharedStrings.xml").match(/<si>[\s\S]*?<\/si>/g) || [])
    .map((si) => decode((si.match(/<t[^>]*>[\s\S]*?<\/t>/g) || []).map((t) => t.replace(/<[^>]+>/g, "")).join("")));
  const rels = text("xl/_rels/workbook.xml.rels");
  const sheets = {};
  for (const m of text("xl/workbook.xml").matchAll(/<sheet [^>]*?name="([^"]+)"[^>]*?r:id="([^"]+)"/g)) {
    const target = (rels.match(new RegExp(`<Relationship [^>]*Id="${m[2]}"[^>]*>`)) || [""])[0].match(/Target="([^"]+)"/)[1];
    const xml = text("xl/" + target.replace(/^\/?xl\//, ""));
    const cells = {};
    for (const c of xml.match(/<c [^>]*?(?:\/>|>[\s\S]*?<\/c>)/g) || []) {
      const ref = c.match(/ r="([A-Z]+\d+)"/)[1];
      const t = (c.match(/ t="([^"]+)"/) || [])[1];
      const v = (c.match(/<v>([\s\S]*?)<\/v>/) || [])[1];
      const is = (c.match(/<is>[\s\S]*?<t[^>]*>([\s\S]*?)<\/t>/) || [])[1];
      let val = null;
      if (t === "s") val = shared[+v];
      else if (t === "inlineStr") val = decode(is || "");
      else if (t === "str" || t === "e") val = v == null ? null : decode(v);
      else if (t === "b") val = v === "1";
      else if (v != null) val = Number(v);
      if (val !== null && val !== "") cells[ref] = val;
    }
    sheets[decode(m[1])] = cells;
  }
  return sheets;
}

/* ---------------------------------------------------- workbook -> JSON map */

// Spreadsheet option labels -> stable keys used by assets/cost-calculator.js.
// If someone renames an option in the workbook, the build stops with a clear
// error instead of silently dropping it.
const CATEGORIES = {
  "Permits & Fees": ["permits", { "Tier 1 county (lower fees)": "tier1", "Tier 2 county (mid fees)": "tier2", "Tier 3 county (higher fees)": "tier3", "Unknown / not yet determined": "unknown" }],
  "Site Prep": ["sitePrep", { "Cleared & flat": "cleared", "Light clearing": "light", "Heavy clearing": "heavy", "Not sure": "unknown" }],
  "Foundation": ["foundation", { "Piers / tie-downs": "piers", "Slab": "slab", "Not sure": "unknown" }],
  "Water": ["water", { "City water tap": "city", "Well (drilled, pump, tank)": "well", "Not sure": "unknown" }],
  "Sewer": ["sewer", { "City sewer tap": "city", "Septic (design, tank, drain field)": "septic", "Not sure": "unknown" }],
  "Electric": ["electric", { "On-site / at the road": "onsite", "Nearby (short trench/pole run)": "nearby", "Far from road": "far", "Not sure": "unknown" }],
  "Access / Driveway": ["access", { "Short (paved frontage)": "short", "Medium": "medium", "Long / dirt road needs improvement": "long", "Not sure": "unknown" }],
  "Finish-Outs (add per item selected)": ["finishOuts", { "Porch / deck": "porch", "Carport / garage": "carport", "Skirting": "skirting", "Steps / landing only (code minimum)": "steps" }],
  "Financing & Soft Costs": ["financing", { "Cash purchase": "cash", "Financed (loan)": "loan", "Unsure": "unknown" }],
};
const FLOOD = { "Flood zone — Yes": "yes", "Flood zone — Unknown": "unknown", "Flood zone — No": "no" };
const SECTIONS = { "Single section": "single", "Double section": "double", "Triple section": "triple", "Not sure": "unknown" };

function money(v, where) {
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0) throw new Error(`${where}: expected a dollar amount, found ${JSON.stringify(v)}`);
  return v;
}

function build(sheets) {
  const cr = sheets["Cost Ranges"], ct = sheets["County Tiers"];
  if (!cr || !ct) throw new Error("workbook is missing the 'Cost Ranges' or 'County Tiers' tab");
  const categories = {}, flood = {}, sections = {};
  let contingencyPct = null, current = null, block = "categories";

  for (let r = 5; r <= 200; r++) {
    const A = cr["A" + r], B = cr["B" + r], D = cr["D" + r], E = cr["E" + r];
    if (typeof A === "string" && A.startsWith("Modifiers")) { block = "modifiers"; continue; }
    if (typeof A === "string" && A.startsWith("Home Size")) { block = "sections"; continue; }
    if (typeof A === "string" && A.startsWith("Contingency")) { contingencyPct = D; continue; }
    if (block === "categories") {
      if (A) {
        if (!CATEGORIES[A]) throw new Error(`Cost Ranges row ${r}: unknown category "${A}"`);
        current = A;
      }
      if (!B || !current) continue;
      const [catKey, map] = CATEGORIES[current];
      const key = map[B];
      if (!key) throw new Error(`Cost Ranges row ${r}: unknown option "${B}" under "${current}"`);
      (categories[catKey] = categories[catKey] || {})[key] = { low: money(D, `row ${r} low`), high: money(E, `row ${r} high`) };
    } else if (block === "modifiers" && FLOOD[A]) {
      flood[FLOOD[A]] = { low: money(D, `row ${r} low`), high: money(E, `row ${r} high`) };
    } else if (block === "sections" && SECTIONS[A]) {
      sections[SECTIONS[A]] = { lowMult: money(D, `row ${r} low multiplier`), highMult: money(E, `row ${r} high multiplier`) };
    }
  }

  // Every option the calculator can ask about must be present.
  for (const [label, [key, map]] of Object.entries(CATEGORIES)) {
    for (const k of Object.values(map)) if (!categories[key] || !categories[key][k]) throw new Error(`missing "${label}" option for ${k}`);
  }
  for (const k of Object.values(FLOOD)) if (!flood[k]) throw new Error(`missing flood-zone modifier: ${k}`);
  for (const k of Object.values(SECTIONS)) if (!sections[k]) throw new Error(`missing home-size multiplier: ${k}`);
  if (typeof contingencyPct !== "number" || contingencyPct < 0 || contingencyPct > 0.5) throw new Error(`contingency % looks wrong: ${contingencyPct}`);
  for (const [cat, opts] of Object.entries(categories)) for (const [k, v] of Object.entries(opts)) {
    if (v.low > v.high) throw new Error(`${cat}.${k}: low (${v.low}) is above high (${v.high})`);
  }

  const countyTiers = {};
  for (let r = 5; r <= 200; r++) {
    const name = ct["A" + r], tier = ct["B" + r];
    if (!name) continue;
    if (tier == null) continue; // blank = unknown tier -> widest permit range
    if (![1, 2, 3].includes(Number(tier))) throw new Error(`County Tiers row ${r}: tier for ${name} must be 1, 2 or 3 (found ${tier})`);
    countyTiers[name] = Number(tier);
  }
  return { categories, flood, sections, contingencyPct, countyTiers };
}

/* ------------------------------------------------------ past-quote replay */

const ANSWER = {
  D: ["sitePrep", CATEGORIES["Site Prep"][1]],
  F: ["foundation", CATEGORIES["Foundation"][1]],
  G: ["water", CATEGORIES["Water"][1]],
  H: ["sewer", CATEGORIES["Sewer"][1]],
  I: ["electric", CATEGORIES["Electric"][1]],
  J: ["access", CATEGORIES["Access / Driveway"][1]],
  S: ["sections", SECTIONS],
  W: ["financing", CATEGORIES["Financing & Soft Costs"][1]],
};

function checkQuotes(sheets, data) {
  const pq = sheets["Past Quotes"];
  const engine = createRequire(import.meta.url)(path.join(SITE, "assets", "cost-calculator.js"));
  const fmt = (n) => "$" + Math.round(n).toLocaleString("en-US");
  const rows = [];
  for (let r = 5; r <= 500; r++) {
    const costs = ["K", "L", "M", "N", "O", "P", "Q"].map((c) => pq["" + c + r]);
    if (!pq["B" + r] || costs.every((v) => v == null)) continue;
    const a = { county: pq["B" + r], flood: { No: "no", Yes: "yes", Unknown: "unknown" }[pq["E" + r]] || "unknown", extras: [] };
    for (const [col, [key, map]] of Object.entries(ANSWER)) a[key] = map[pq[col + r]] || "unknown";
    if (pq["T" + r] === "Yes") a.extras.push("porch");
    if (pq["U" + r] === "Yes") a.extras.push("carport");
    if (pq["V" + r] === "Yes") a.extras.push("skirting");
    rows.push({ n: pq["A" + r], r, a, costs, actual: costs.reduce((s, v) => s + (Number(v) || 0), 0) });
  }
  if (!rows.length) { console.log("\nPast Quotes: no filled-in rows yet — nothing to check."); return; }
  console.log(`\nPast Quotes replay (${rows.length}):`);
  let inside = 0;
  for (const q of rows) {
    const res = engine.compute(data, q.a);
    const ok = q.actual >= res.low && q.actual <= res.high;
    if (ok) inside++;
    const where = ok ? "inside" : q.actual < res.low ? "BELOW range" : "ABOVE range";
    console.log(`  #${q.n} ${String(q.a.county).padEnd(12)} actual ${fmt(q.actual).padStart(9)}  calculator ${fmt(res.low)}–${fmt(res.high)}  ${where}`);
    // Per-category check: which yellow cells to tune. Quote columns K..Q map
    // onto calculator lines (utilities = water + sewer + electric).
    const sum = (keys) => res.lines.filter((l) => keys.includes(l.key)).reduce((s, l) => ({ low: s.low + l.low, high: s.high + l.high }), { low: 0, high: 0 });
    const GROUPS = [
      ["Permits & fees", ["permits"]], ["Site prep", ["sitePrep"]], ["Foundation", ["foundation"]],
      ["Utilities", ["water", "sewer", "electric"]], ["Access", ["access"]],
      ["Finish-outs", ["porch", "carport", "skirting", "steps"]], ["Financing/soft", ["financing"]],
    ];
    GROUPS.forEach(([label, keys], i) => {
      const v = q.costs[i];
      if (v == null) return;
      const g = sum(keys);
      if (v < g.low || v > g.high) console.log(`       ${label}: ${fmt(v)} is ${v < g.low ? "below" : "above"} ${fmt(g.low)}–${fmt(g.high)}`);
    });
  }
  console.log(`  ${inside}/${rows.length} actual totals fell inside the calculator's range.`);
  console.log("  (Flood-zone work has no column of its own on Past Quotes; it usually lands in site prep or foundation.)");
}

/* ------------------------------------------------------------------- main */

const sheets = readWorkbook(XLSX);
const d = build(sheets);
const { COUNTIES } = createRequire(import.meta.url)(path.join(SITE, "assets", "cost-calculator.js"));
const badCounty = Object.keys(d.countyTiers).filter((n) => !COUNTIES.includes(n));
if (badCounty.length) throw new Error(`County Tiers has names that aren't Florida counties (check spelling): ${badCounty.join(", ")}`);
const out = {
  _meta: {
    source: path.basename(XLSX),
    generated: new Date().toISOString(),
    placeholder: !flag("--reviewed"),
    note: "Generated by model-showroom/scripts/build-cost-data.mjs — edit the workbook, not this file. Costs are land-to-placement only; the home price and its delivery are extra.",
  },
  categories: d.categories,
  flood: d.flood,
  sections: d.sections,
  contingencyPct: d.contingencyPct,
  countyTiers: d.countyTiers,
};
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
console.log(`Wrote ${OUT}`);
console.log(`  ${Object.keys(out.categories).length} categories, ${Object.keys(out.countyTiers).length} counties with a fee tier, contingency ${out.contingencyPct * 100}%`);
console.log(`  numbers flagged as ${out._meta.placeholder ? "PLACEHOLDER (page shows a test-numbers banner; pass --reviewed once they're real)" : "REVIEWED"}`);
if (flag("--check-quotes")) checkQuotes(sheets, out);
