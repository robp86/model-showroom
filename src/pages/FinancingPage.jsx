import Seo from "../components/Seo";
import ContactSection from "../components/layout/ContactSection";

const OPTIONS = [
  { t: "Chattel / home-only loans", d: "Finance the home itself when you're placing it on land you own or lease." },
  { t: "FHA & government-backed", d: "Lower-down-payment options for qualified buyers on manufactured homes." },
  { t: "Land + home packages", d: "Bundle the land and the home into one financing package." },
  { t: "In-house guidance", d: "We connect you with trusted lenders and help you compare offers." },
];

export default function FinancingPage() {
  return (
    <div className="container section">
      <Seo
        title="Financing"
        path="/financing"
        description="Manufactured-home financing guidance from Native Sun Homes — chattel, FHA, and land-plus-home loan options, with help comparing lenders. Serving all of Florida."
      />
      <p className="eyebrow">Financing</p>
      <h1>Financing help that's actually helpful.</h1>
      <p className="lead" style={{ maxWidth: 640 }}>
        Manufactured-home financing isn't one-size-fits-all. We'll help you find
        the right loan type for your situation and get a realistic monthly payment
        range — before you fall in love with a floor plan.
      </p>

      <div className="path-grid" style={{ marginTop: 24 }}>
        {OPTIONS.map((o) => (
          <div key={o.t} className="path-card">
            <div className="icon" aria-hidden="true">💵</div>
            <h3>{o.t}</h3>
            <p>{o.d}</p>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginTop: 40, alignItems: "start" }}>
        <div>
          <h2>Get pre-qualified guidance</h2>
          <p className="muted">
            Share a few details and we'll reach out with financing options and
            next steps. No hard credit pull to start the conversation.
          </p>
          <ul className="features-list" style={{ marginTop: 12 }}>
            <li>✔ No-pressure consultation</li>
            <li>✔ Multiple lender options</li>
            <li>✔ Help understanding payments</li>
            <li>✔ Land &amp; delivery factored in</li>
          </ul>
        </div>
        <ContactSection compact />
      </div>
    </div>
  );
}
