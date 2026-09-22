// Fires the GA4 "generate_lead" event (Google's recommended event name for
// lead-gen conversions) via the global gtag() loaded in index.html.
// `source` identifies which capture point produced the lead, e.g.
// "contact_form" or "manny_bot" — lets Ads/GA4 reporting split conversions
// by channel. No-ops safely if gtag isn't present (blocked, local dev).
export function trackLead(source) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", "generate_lead", { lead_source: source });
  }
}
