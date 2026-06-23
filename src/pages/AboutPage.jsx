import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import CTASection from "../components/layout/CTASection";
import { BUSINESS, VALUE_PROPS, SERVICE_CITIES } from "../data/business";

export default function AboutPage() {
  return (
    <>
      <Seo
        title="About"
        path="/about"
        description="Native Sun Homes LLC partners with Champion Homes (70+ years of craftsmanship) to sell new manufactured & modular homes across all of Florida. Quality homes, delivered with care."
      />
      <div className="container section">
        <img
          src="/images/Logo.jpg"
          alt="Native Sun Homes LLC"
          className="about-logo"
        />
        <p className="eyebrow">About Native Sun Homes</p>
        <h1>Quality homes, delivered with care.</h1>
        <p className="lead" style={{ maxWidth: 680 }}>
          Native Sun Homes LLC partners with Champion Homes — one of America's most
          trusted manufactured home builders — to bring you premium housing with
          over 70 years of craftsmanship behind every build. We specialize in the
          sale of new manufactured homes tailored to fit many lifestyles and
          budgets, combining industry expertise with a commitment to exceptional
          customer service.
        </p>
        <p className="lead" style={{ maxWidth: 680 }}>
          We're dedicated, knowledgeable, and approachable — and we can't wait to
          get you home.
        </p>
        <div className="btn-row" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
          <Link className="btn btn--primary" to="/homes">Browse Our Homes</Link>
          <Link className="btn btn--gold" to="/contact">Request a Free Estimate</Link>
        </div>
      </div>

      <section className="section section--cream">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">Why Native Sun Homes</p>
              <h2>What every home comes with</h2>
            </div>
          </div>
          <div className="path-grid">
            {VALUE_PROPS.map((v) => (
              <div key={v.title} className="path-card">
                <div className="icon" aria-hidden="true">{v.icon}</div>
                <h3>{v.title}</h3>
                <p>{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">{BUSINESS.serviceArea}</p>
              <h2>Statewide delivery &amp; installation</h2>
              <p>
                We deliver and set up homes across Florida — from the Gulf Coast to
                the Atlantic, the Panhandle to South Florida. A few of the communities
                we serve:
              </p>
            </div>
          </div>
          <div className="pill-row">
            {SERVICE_CITIES.map((c) => (
              <span key={c} className="badge badge--muted">{c}</span>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        title="Ready to find your home?"
        text="Tell us what you're looking for and we'll help with pricing, financing, and a free estimate — anywhere in Florida."
      />
    </>
  );
}
