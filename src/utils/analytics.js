// Fires the GA4 "generate_lead" event (Google's recommended event name for
// lead-gen conversions) via the global gtag() loaded in index.html.
// `source` identifies which capture point produced the lead, e.g.
// "contact_form" or "manny_bot" — lets Ads/GA4 reporting split conversions
// by channel. `extra` adds event parameters such as { county } (registered as
// a GA4 custom dimension); empty values are dropped. No-ops safely if gtag
// isn't present (blocked, local dev).
export function trackLead(source, extra = {}) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    const params = { lead_source: source };
    for (const [k, v] of Object.entries(extra)) if (v) params[k] = v;
    window.gtag("event", "generate_lead", params);
  }
}
