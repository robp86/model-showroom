// County ADU rule pages for nativesunhomes.com, generated from the same data
// the ADU calculator uses so the two can never disagree.
//
//   node scripts/build-adu-pages.mjs [--site <dir>]
//
// Writes <site>/adu/index.html (hub for all 67 counties) and one page per
// county at <site>/adu/<slug>.html (served at /adu/<slug>). Verified counties
// are indexable; the 27 estimate-only counties are noindex, since their
// content is near-identical regional estimates. Re-run after editing
// data/fl-zoning-db.json or assets/adu-calculator.js, then redeploy.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const SITE = path.resolve(args.includes("--site") ? args[args.indexOf("--site") + 1] : path.join(ROOT, "..", "Native Suns Homes LLC", "native_sun_homes_updated_site"));
const BASE = "https://nativesunhomes.com";

const require = createRequire(import.meta.url);
const db = require(path.join(SITE, "data", "fl-zoning-db.json"));
const calc = require(path.join(SITE, "assets", "adu-calculator.js"));

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const slug = (county) => county.toLowerCase().replace(/\./g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-county";
const fmt = (n) => Math.round(n).toLocaleString("en-US");
const lotText = (sqft) => (sqft >= 43560 ? `${+(sqft / 43560).toFixed(2)} acre${sqft === 43560 ? "" : "s"}` : `${fmt(sqft)} sq ft`);

// Our records include notes written for the sales chatbots. Public pages get
// them reworded or removed; anything else that still reads internal stops the
// build so it can't slip onto the site.
const REWRITES = [
  [/ - big cost saver to mention to customers\./g, "."],
  [/\s*Re-verify before quoting\./g, ""],
  [/\s*Confirm current (ADU )?status before quoting\./g, ""],
  [/\s*Verify directly\./g, ""],
  [/Customer MUST check their specific city's Development Services\./g, "Check with your city's development services department."],
  [/ - re-check status before turning a customer away\./g, "."],
  [/Currently the MOST restrictive big city in SW Florida: no full rentable ADUs\./g, "No full rentable ADUs right now."],
  [/\bFREE\b/g, "free"], [/\bMOST\b/g, "most"], [/\bMUST\b/g, "must"], [/\bNOT\b/g, "not"], [/\bONLY\b/g, "only"],
];
// "verify" alone is fine reader advice; the all-caps VERIFY is a staff note.
const INTERNAL = /customer|quoting|chatbot|\bbot\b|turning .* away|TODO/i;
const INTERNAL_CAPS = /\bVERIFY\b|UNCONFIRMED/;
function clean(text, where) {
  let t = String(text || "");
  for (const [re, to] of REWRITES) t = t.replace(re, to);
  t = t.replace(/\s{2,}/g, " ").trim();
  if (INTERNAL.test(t) || INTERNAL_CAPS.test(t)) throw new Error(`${where} still has internal wording: ${t}`);
  return t;
}

const STYLE = fs.readFileSync(path.join(SITE, "charlotte-county.html"), "utf8").match(/<style>[\s\S]*?<\/style>/)[0]
  .replace("</style>", `
/* ADU rule pages */
.facts{width:100%;border-collapse:collapse;margin:1.2rem 0;font-size:15px;background:#fff;border:1px solid #ECEAE0;border-radius:12px;overflow:hidden}
.facts th,.facts td{text-align:left;padding:.85rem 1rem;border-bottom:1px solid #ECEAE0;vertical-align:top}
.facts th{width:38%;color:var(--tm);font-weight:600}
.facts td{color:var(--navy-dk);font-weight:600}
.facts tr:last-child th,.facts tr:last-child td{border-bottom:none}
.quote{background:#fff;border-left:3px solid var(--gold);border-radius:6px;padding:.9rem 1.1rem;font-size:14.5px;color:var(--tm);margin:1rem 0}
.est{display:inline-block;background:var(--gold-pale);color:#9C6300;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;padding:5px 11px;border-radius:999px;margin-bottom:.8rem}
.ver{display:inline-block;background:#E6F4EE;color:#2F8F6B;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;padding:5px 11px;border-radius:999px;margin-bottom:.8rem}
.cities li{margin:.5rem 0 .5rem 1.1rem;color:var(--td)}
.hub{width:100%;border-collapse:collapse;font-size:14.5px;margin-top:1rem}
.hub td{padding:.7rem .4rem;border-bottom:1px solid #ECEAE0;vertical-align:top}
.hub td:first-child{font-weight:700;white-space:nowrap}
.hub small{color:var(--tl);font-weight:600;text-transform:uppercase;font-size:10.5px;letter-spacing:.8px}
</style>`);

function head({ title, description, canonical, noindex, jsonld }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">

<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-20GTF6QSCF"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-20GTF6QSCF');
</script>
<script src="/assets/tracking.js"></script>
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<link rel="icon" href="/assets/favicon.ico" sizes="any">
<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<meta name="theme-color" content="#1a4b9c">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex,follow">\n' : ""}<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${BASE}/assets/hero.jpg">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Raleway:wght@300;400;500;600;700&display=swap" rel="stylesheet">
${jsonld.map((j) => `<script type="application/ld+json">\n${JSON.stringify(j, null, 1)}\n</script>`).join("\n")}
${STYLE}
</head>
<body>

<nav>
  <a href="/" class="nl">
    <img src="/assets/logo.jpg" alt="Native Sun Homes LLC">
    <div class="nb"><span>Native Sun Homes</span><span>LLC</span></div>
  </a>
  <a href="tel:+18632634736" class="ncta">Call (863) 263-4736</a>
</nav>
`;
}

const FOOTER = `
<footer>
  <p><strong style="color:#fff">Native Sun Homes LLC</strong></p>
  <address class="fadr">265 E Marion Ave Unit 113 · Punta Gorda, FL 33950<br>
    <a href="tel:+18632634736">(863) 263-4736</a> · Mon–Fri 7am–7pm · Sat–Sun 8am–5pm</address>
  <p><a href="/adu/">ADU rules by county</a> · <a href="/adu-calculator">ADU size calculator</a> · <a href="/service-areas">Florida service areas</a> · <a href="/">Full site</a> · <a href="https://nativesun.homes/">Online showroom</a></p>
</footer>
</body>
</html>
`;

const breadcrumb = (items) => ({
  "@context": "https://schema.org", "@type": "BreadcrumbList",
  itemListElement: items.map(([name, url], i) => ({ "@type": "ListItem", position: i + 1, name, item: url })),
});

// Existing service-area pages, so each county page can link to its sibling.
const SERVICE_PAGES = new Set(fs.readdirSync(SITE).filter((f) => /-county\.html$/.test(f)).map((f) => f.replace(".html", "")));

function countyPage(c) {
  const name = c.county, s = slug(name), url = `${BASE}/adu/${s}`;
  const q = encodeURIComponent(name);
  const entry = calc.COUNTY[name];
  const verified = !!c.verified;
  const allowed = { yes: "Yes", conditional: "Yes, with conditions", no: "Not right now" }[c.adu_allowed] || "Check with the county";
  const owner = c.owner_occupancy_required === "true" ? "Yes — in the main home or the ADU" : "Not confirmed in our records";

  let sizeRule, lotRow = null, minRow = null, notes = [];
  if (verified) {
    sizeRule = entry.size.rule;
    if (entry.minSize) minRow = `${fmt(entry.minSize)} sq ft`;
    if (entry.lotMinSqft) lotRow = `${lotText(entry.lotMinSqft)}${entry.lotHard ? "" : " (typical)"}`;
    else if (c.min_lot_size) lotRow = clean(c.min_lot_size, `${name} min_lot_size`);
    notes = (entry.notes || []).concat(entry.lotNote ? [entry.lotNote] : []);
  } else {
    const e = c.estimate, f = e.adu_max_size.fixed_sqft_range, p = e.adu_max_size.pct_of_primary_range;
    sizeRule = `Not published. Nearby ${e.region} counties typically allow ${fmt(f[0])}–${fmt(f[1])} sq ft, or ${p[0] === p[1] ? p[0] : p[0] + "–" + p[1]}% of the main home (estimate).`;
  }
  const sizeShort = verified ? sizeRule : "not published — see the estimate below";

  const contact = [
    c.zoning_dept_phone ? `<a href="tel:${esc(c.zoning_dept_phone.replace(/[^\d+]/g, ""))}">${esc(c.zoning_dept_phone)}</a>` : "",
    c.zoning_dept_url ? `<a href="${esc(c.zoning_dept_url)}" target="_blank" rel="noopener">zoning department website ↗</a>` : "",
  ].filter(Boolean).join(" · ");

  const cities = (c.municipalities || []).map((m) => {
    const ce = calc.CITY[`${name}>${m.city}`];
    const rule = m.adu_allowed === "no" ? "ADUs not allowed right now" : ce ? ce.size.rule : "rules not yet confirmed in our records";
    const cond = m.verified ? clean(m.adu_conditions, `${name}>${m.city}`) : "";
    return `<li><strong>${esc(m.city)}:</strong> ${esc(rule.charAt(0).toUpperCase() + rule.slice(1))}.${cond ? " " + esc(cond) : ""}</li>`;
  });

  // Google shows ~60-char titles and ~155-char descriptions; long rules get a
  // generic description instead of being cut off mid-sentence.
  const fullTitle = `${name} County, FL ADU Rules & Size Limits | Native Sun Homes`;
  const title = fullTitle.length <= 62 ? fullTitle : `${name} County, FL ADU Rules & Size Limits`;
  const withRule = `${name} County, FL ADU size limit: ${sizeRule.replace(/\.$/, "")}. Lot, owner-occupancy, and permit details, plus a free calculator.`;
  const description = verified && withRule.length <= 158
    ? withRule
    : `ADU rules for ${name} County, FL: how big a backyard home can be, lot and owner-occupancy rules, and who to call. Free ADU size calculator.`;

  const faq = verified ? [
    [`Can I build an ADU in ${name} County, Florida?`, `${allowed}. ${clean(c.adu_conditions, `${name} conditions`)}`],
    [`How big can an ADU be in ${name} County?`, `${sizeRule}.`.replace(/\.\.$/, ".") + (minRow ? ` The minimum ADU size is ${minRow}.` : "")],
    [`Does the owner have to live on the property?`, c.owner_occupancy_required === "true" ? `Yes. ${name} County requires the owner to live on the property, in either the main home or the ADU.` : `Our records don't confirm an owner-occupancy requirement for ${name} County — ask the county zoning department before you buy.`],
    [`Can a manufactured home be an ADU in ${name} County?`, `Florida's 2025 ADU law counts a manufactured home built on or after January 1, 2025 to HUD standards as an accessory dwelling unit. ${name} County's size, lot, and setback rules still apply.`],
  ] : [];

  const jsonld = [breadcrumb([["Home", `${BASE}/`], ["ADU rules by county", `${BASE}/adu/`], [`${name} County`, url]])];
  if (faq.length) jsonld.push({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([q2, a]) => ({ "@type": "Question", name: q2, acceptedAnswer: { "@type": "Answer", text: a } })) });

  const servicePage = SERVICE_PAGES.has(s) ? `<a href="/${s}">Manufactured &amp; modular homes in ${esc(name)} County</a> · ` : "";

  return head({ title, description, canonical: url, noindex: !verified, jsonld }) + `
<header class="hero">
  <div class="wrap">
    <p class="crumb"><a href="/">Home</a> &nbsp;›&nbsp; <a href="/adu/">ADU Rules by County</a> &nbsp;›&nbsp; ${esc(name)} County</p>
    <h1>ADU Rules in ${esc(name)} County, Florida</h1>
    <p class="lead">${verified
      ? `How big a backyard home (accessory dwelling unit) can be in ${esc(name)} County, who can build one, and who to call to confirm — from the county's published rules.`
      : `${esc(name)} County hasn't published an ADU size rule we could confirm. Here's what Florida law allows, an estimate from nearby counties, and who to call.`}</p>
  </div>
</header>

<section class="calcband">
  <div class="wrap">
    <p><strong>Know your main home's size?</strong> Get the exact limit for your lot in seconds.</p>
    <div class="cb-btns">
      <a class="cb-btn cb-gold" href="/adu-calculator?county=${q}">Calculate my ADU size</a>
      <a class="cb-btn cb-navy" href="/cost-calculator?county=${q}">Estimate site costs</a>
    </div>
  </div>
</section>

<section class="body">
  <div class="wrap">
    <span class="${verified ? "ver" : "est"}">${verified ? "✓ From the county's published rules" : "≈ Estimate — no published rule found"}</span>
    <h2>${esc(name)} County ADU rules at a glance</h2>
    <table class="facts">
      <tr><th>ADUs allowed?</th><td>${esc(verified ? allowed : "Florida law requires counties to allow them on single-family lots")}</td></tr>
      <tr><th>Maximum ADU size</th><td>${esc(sizeShort.charAt(0).toUpperCase() + sizeShort.slice(1))}</td></tr>
      ${minRow ? `<tr><th>Minimum ADU size</th><td>${esc(minRow)}</td></tr>` : ""}
      ${lotRow ? `<tr><th>Minimum lot size</th><td>${esc(lotRow)}</td></tr>` : ""}
      <tr><th>Owner must live on site?</th><td>${esc(verified ? owner : "Not confirmed")}</td></tr>
      <tr><th>Manufactured home as an ADU?</th><td>Yes, if built 2025 or later to HUD standards (Florida law)</td></tr>
    </table>
    ${verified
      ? `<div class="quote"><strong>What the county rules say:</strong> &ldquo;${esc(c.max_adu_size_sqft)}&rdquo;</div>
    <p>${esc(clean(c.adu_conditions, `${name} conditions`))}</p>
    ${notes.length ? `<ul class="cities">${notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>` : ""}
    <p class="note">Source: ${esc(clean(c.source, `${name} source`))}.</p>`
      : `<p>${esc(sizeRule)}</p>
    <p>This range is based on the published rules of verified neighbors: ${esc(c.estimate.basis_counties.join(", "))}. It's a planning estimate, not ${esc(name)} County's rule.</p>
    <p>${esc(clean(c.permit_notes, `${name} permit_notes`))}</p>`}
  </div>
</section>
${cities.length ? `
<section class="body alt">
  <div class="wrap">
    <p class="eyebrow">Inside City Limits</p>
    <h2>Cities set their own rules</h2>
    <p>If the property is inside city limits, the city's ADU rules apply instead of the county's.</p>
    <ul class="cities">${cities.join("\n")}</ul>
  </div>
</section>` : ""}

<section class="body${cities.length ? "" : " alt"}">
  <div class="wrap">
    <p class="eyebrow">Before You Build</p>
    <h2>Rules are changing — confirm first</h2>
    <p>Florida requires every county and city to adopt an ADU ordinance by <strong>December 1, 2026</strong>, so ${esc(name)} County's rules may change. Short-term rentals (under 30 days) of an ADU are not allowed under state law.</p>
    ${contact ? `<p><strong>Confirm with ${esc(name)} County:</strong> ${contact}</p>` : ""}
    <p class="note">${esc(db._meta.disclaimer)}</p>
  </div>
</section>
${faq.length ? `
<section class="body alt">
  <div class="wrap">
    <p class="eyebrow">Common Questions</p>
    <h2>${esc(name)} County ADUs, answered</h2>
    <div class="faq">
      ${faq.map(([q2, a], i) => `<details${i ? "" : " open"}><summary>${esc(q2)}</summary><p>${esc(a)}</p></details>`).join("\n      ")}
    </div>
  </div>
</section>` : ""}

<section class="body">
  <div class="wrap">
    <p class="eyebrow">Keep Exploring</p>
    <h2>More ADU rules &amp; homes</h2>
    <p style="line-height:2">${servicePage}<a href="/adu/">ADU rules for all 67 Florida counties</a> · <a href="https://nativesun.homes/homes?max=1200&amp;utm_source=adu-county-page&amp;utm_medium=referral&amp;utm_content=${s}">ADU-sized homes in our showroom</a></p>
  </div>
</section>

<section class="cta-band">
  <h2>Ready to add a home to your lot?</h2>
  <p>We'll confirm ${esc(name)} County's rules for your property and help you pick a home that fits — free.</p>
  <a class="btnp" href="/welcome?utm_source=adu-county-page&amp;utm_medium=page&amp;utm_content=${s}">Start Here</a>
</section>
` + FOOTER;
}

function hubPage(counties) {
  const rows = counties.map((c) => {
    const rule = c.verified ? calc.COUNTY[c.county].size.rule : "No published rule — estimate from nearby counties";
    return `<tr><td><a href="/adu/${slug(c.county)}">${esc(c.county)}</a></td><td>${esc(rule.charAt(0).toUpperCase() + rule.slice(1))}<br><small>${c.verified ? "Published county rule" : "Estimate"}</small></td></tr>`;
  }).join("\n");
  const url = `${BASE}/adu/`;
  return head({
    title: "Florida ADU Rules by County (All 67) | Native Sun Homes",
    description: "ADU size limits and rules for every Florida county, from each county's published rules: size caps, lot minimums, owner-occupancy, and who to call.",
    canonical: url, noindex: false,
    jsonld: [breadcrumb([["Home", `${BASE}/`], ["ADU rules by county", url]])],
  }) + `
<header class="hero">
  <div class="wrap">
    <p class="crumb"><a href="/">Home</a> &nbsp;›&nbsp; ADU Rules by County</p>
    <h1>Florida ADU Rules by County</h1>
    <p class="lead">How big a backyard home can be in each of Florida's 67 counties. ${counties.filter((c) => c.verified).length} come from the county's published rules; the rest are labeled estimates from neighboring counties.</p>
  </div>
</header>

<section class="calcband">
  <div class="wrap">
    <p><strong>Want the exact number for your lot?</strong> Enter your county and home size.</p>
    <div class="cb-btns">
      <a class="cb-btn cb-gold" href="/adu-calculator">ADU size calculator</a>
      <a class="cb-btn cb-navy" href="/cost-calculator">Site cost calculator</a>
    </div>
  </div>
</section>

<section class="body">
  <div class="wrap">
    <p class="eyebrow">All 67 Counties</p>
    <h2>Maximum ADU size by county</h2>
    <p>Inside city limits, the city's rules apply instead. Florida requires every county and city to adopt an ADU ordinance by December 1, 2026, so limits may change — always confirm with the local zoning department.</p>
    <table class="hub">${rows}</table>
    <p class="note">${esc(db._meta.disclaimer)}</p>
  </div>
</section>
` + FOOTER;
}

const outDir = path.join(SITE, "adu");
fs.mkdirSync(outDir, { recursive: true });
const counties = [...db.counties].sort((a, b) => a.county.localeCompare(b.county));
for (const c of counties) {
  if (c.verified && !calc.COUNTY[c.county]) throw new Error(`no calculator rule for verified county ${c.county}`);
  fs.writeFileSync(path.join(outDir, `${slug(c.county)}.html`), countyPage(c));
}
fs.writeFileSync(path.join(outDir, "index.html"), hubPage(counties));
const v = counties.filter((c) => c.verified).length;
console.log(`Wrote ${counties.length} county pages (${v} indexable, ${counties.length - v} noindex estimates) + hub to ${outDir}`);
fs.writeFileSync(path.join(outDir, "..", "data", "adu-pages.json"), JSON.stringify(counties.map((c) => ({ county: c.county, path: `/adu/${slug(c.county)}`, indexable: !!c.verified })), null, 1) + "\n");
