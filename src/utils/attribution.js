// Cross-domain lead attribution. Sunny (nativesunhomes.com) appends
// utm_* + lp (original landing page) to the handoff URL; we capture them once
// into sessionStorage so they survive SPA navigation, and attach them to every
// lead POST (Manny bot + contact form). Field names match the Netlify form.
const KEY = "nsh_attrib";

const PARAM_MAP = {
  utm_source: "utm_source",
  utm_medium: "utm_medium",
  utm_campaign: "utm_campaign",
  utm_content: "utm_content",
  utm_term: "utm_term",
  lp: "landing_page",
};

export function captureAttribution() {
  let stored;
  try {
    stored = JSON.parse(sessionStorage.getItem(KEY) || "{}");
  } catch {
    stored = {};
  }
  const params = new URLSearchParams(window.location.search);
  let changed = false;
  for (const [param, key] of Object.entries(PARAM_MAP)) {
    const v = params.get(param);
    if (v && stored[key] !== v) {
      stored[key] = v;
      changed = true;
    }
  }
  if (!stored.referrer && document.referrer) {
    stored.referrer = document.referrer;
    changed = true;
  }
  if (changed) {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(stored));
    } catch {
      /* storage unavailable — attribution just won't persist */
    }
  }
  return stored;
}

// Flat fields ready to spread into a lead POST body.
export function attributionFields() {
  const a = captureAttribution();
  return {
    utm_source: a.utm_source || "",
    utm_medium: a.utm_medium || "",
    utm_campaign: a.utm_campaign || "",
    referrer: a.referrer || "",
    "landing-page": a.landing_page || "",
  };
}
