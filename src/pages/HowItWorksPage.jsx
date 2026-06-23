import Seo from "../components/Seo";
import CTASection from "../components/layout/CTASection";

const STEPS = [
  { n: "1", t: "Explore models & floor plans", d: "Browse the showroom, compare layouts, and save the homes you love. Filter by beds, baths, size, and budget." },
  { n: "2", t: "Talk to Native Sun Homes", d: "We'll go over pricing, available options, and what fits your budget — no pressure, just straight answers." },
  { n: "3", t: "Sort out land & financing", d: "Own land already or need guidance? We help with financing options and the land question early." },
  { n: "4", t: "Customize your home", d: "Pick finishes, upgrades, and layout options to make the home yours." },
  { n: "5", t: "Delivery & setup", d: "We coordinate delivery, professional setup, and the final walkthrough." },
  { n: "6", t: "Move in", d: "Get the keys and settle into a home built for your life." },
];

const FAQ = [
  { q: "Do I need to own land first?", a: "Not necessarily. Many buyers purchase land and home together, place a home on family land, or use a community. We'll help you figure out the right path before you commit." },
  { q: "What is a HUD-certified manufactured home?", a: "Manufactured homes are built in a factory to the federal HUD code, then delivered and set up on site. The HUD label certifies the home meets national safety and construction standards." },
  { q: "Manufactured vs. modular — what's the difference?", a: "Both are factory-built. Manufactured homes are built to the HUD code on a permanent chassis; modular homes are built to local/state codes like a site-built home. We carry options and can explain which fits your land and goals." },
  { q: "How does financing work?", a: "There are several loan types for manufactured homes (chattel, FHA, and more). We can point you to lenders and help you understand monthly payment ranges." },
  { q: "How long until I can move in?", a: "It depends on the model, customization, and site prep. Move-in-ready homes are fastest; custom orders take longer. We'll give you a realistic timeline up front." },
  { q: "Why is pricing not listed?", a: "Final pricing depends on options, delivery distance, site prep, and current promotions. Contact us for an accurate, up-to-date quote and a free estimate." },
];

export default function HowItWorksPage() {
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <Seo
        title="How It Works"
        path="/how-it-works"
        description="How buying a manufactured home from Native Sun Homes works — from browsing models to delivery and setup across Florida. Plus financing, land, and HUD-certification FAQs."
        jsonLd={faqLd}
      />
      <div className="container section">
        <p className="eyebrow">How It Works</p>
        <h1>Buying a manufactured home, made simple.</h1>
        <p className="lead" style={{ maxWidth: 640 }}>
          From first browse to move-in day, here's the step-by-step path — with a
          local team guiding you the whole way.
        </p>

        <div className="path-grid" style={{ marginTop: 24 }}>
          {STEPS.map((s) => (
            <div key={s.n} className="path-card">
              <div className="icon" aria-hidden="true">{s.n}</div>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </div>
          ))}
        </div>
      </div>

      <section className="section section--cream">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">Good to know</p>
              <h2>Frequently Asked Questions</h2>
            </div>
          </div>
          <div className="grid-2">
            {FAQ.map((f) => (
              <div key={f.q} className="card-panel">
                <h3 style={{ fontSize: "1.1rem" }}>{f.q}</h3>
                <p className="muted" style={{ margin: 0 }}>{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        title="Still have questions?"
        text="We're happy to walk you through anything — financing, land, delivery, or which model fits your family."
      />
    </>
  );
}
