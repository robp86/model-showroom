// Serverless endpoint for the /admin leads dashboard.
//
// Pulls form submissions from BOTH Netlify sites (showroom + funnel) via the
// Netlify API and returns them normalized. Password-gated: the browser sends
// the shared admin password, which is compared (constant-time) against the
// ADMIN_PASSWORD env var. The Netlify API token never leaves the server.
//
// Required Netlify environment variables (Site settings -> Environment):
//   ADMIN_PASSWORD     the shared passphrase you and Ryan type on /admin
//   NETLIFY_API_TOKEN  a personal access token (User settings -> Applications)
//   SHOWROOM_SITE_ID   this site's API ID (Site settings -> General -> Site ID)
//   FUNNEL_SITE_ID     the funnel site's API ID (nativesunhomes.com)
//
// FUNNEL_SITE_ID is optional — if unset, only this site's leads are returned.

import crypto from "node:crypto";

const API = "https://api.netlify.com/api/v1";

function timingSafeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

// Pull every submission for one site (paginated).
async function fetchSite(siteId, token, label) {
  const out = [];
  for (let page = 1; page <= 20; page++) {
    const res = await fetch(
      `${API}/sites/${siteId}/submissions?per_page=100&page=${page}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) {
      throw new Error(`Netlify API ${res.status} for ${label} (${siteId})`);
    }
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    for (const s of batch) out.push(normalize(s, label));
    if (batch.length < 100) break;
  }
  return out;
}

// Best-effort pick from a submission's fields by trying several key spellings.
function pick(data, keys) {
  for (const k of keys) {
    for (const actual of Object.keys(data)) {
      if (actual.toLowerCase().replace(/[^a-z]/g, "") === k) {
        const v = data[actual];
        if (v != null && String(v).trim() !== "") return String(v).trim();
      }
    }
  }
  return "";
}

function deriveCounty(data, landing) {
  const direct = pick(data, ["county"]);
  if (direct) return direct;
  const inInterest = /([A-Za-z.]+(?:\s[A-Za-z.]+)?)\s+County/i.exec(
    pick(data, ["whatareyouinterestedin", "interest"]) + " " + pick(data, ["message"])
  );
  if (inInterest) return inInterest[1];
  const m = /([a-z]+(?:-[a-z]+)?)-county/i.exec(landing || "");
  return m ? m[1].replace(/-/g, " ") : "";
}

function normalize(s, site) {
  const d = s.data || {};
  const first = pick(d, ["firstname", "first"]);
  const last = pick(d, ["lastname", "last"]);
  const name = pick(d, ["name"]) || [first, last].filter(Boolean).join(" ") || s.name || "";
  const landing = pick(d, ["landingpage", "landing"]);
  const email = pick(d, ["email", "emailaddress"]) || s.email || "";
  return {
    id: s.id,
    site,
    form: s.form_name || "",
    date: s.created_at || "",
    name,
    email,
    phone: pick(d, ["phone", "phonenumber"]),
    model: pick(d, ["model"]),
    interest: pick(d, ["interest", "whatareyouinterestedin"]),
    utm_source: pick(d, ["utmsource"]),
    utm_medium: pick(d, ["utmmedium"]),
    utm_campaign: pick(d, ["utmcampaign"]),
    utm_content: pick(d, ["utmcontent"]),
    referrer: pick(d, ["originalreferrer", "referrer"]),
    landing,
    county: deriveCounty(d, landing),
    financing: pick(d, ["doyouneedfinancinghelp", "financing"]),
    timeframe: pick(d, ["howsoonareyoulookingtomove", "timeframe"]),
    message: pick(d, ["message"]),
    raw: d,
  };
}

export const handler = async (event) => {
  const json = (code, body) => ({
    statusCode: code,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify(body),
  });

  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const token = process.env.NETLIFY_API_TOKEN;
  const pass = process.env.ADMIN_PASSWORD;
  const showroom = process.env.SHOWROOM_SITE_ID;
  const funnel = process.env.FUNNEL_SITE_ID;

  if (!pass || !token || !showroom) {
    return json(500, { error: "Server not configured. Set ADMIN_PASSWORD, NETLIFY_API_TOKEN, SHOWROOM_SITE_ID." });
  }

  let supplied = "";
  try { supplied = (JSON.parse(event.body || "{}").password) || ""; } catch { /* ignore */ }
  if (!timingSafeEqual(supplied, pass)) {
    return json(401, { error: "Wrong password" });
  }

  try {
    const sites = [fetchSite(showroom, token, "Showroom")];
    if (funnel) sites.push(fetchSite(funnel, token, "Funnel"));
    const results = await Promise.all(sites);
    const leads = results.flat().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    return json(200, { count: leads.length, leads, fetchedAt: new Date().toISOString() });
  } catch (e) {
    return json(502, { error: String(e.message || e) });
  }
};
