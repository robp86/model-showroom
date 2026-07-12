import CTAButton from "../common/CTAButton";

// Decorative film strip across the top of the CTA band — pans slowly via a
// pure-CSS marquee (the list is rendered twice so translateX(-50%) loops
// seamlessly). Non-interactive, hidden from AT, paused for reduced motion.
const STRIP_IMAGES = [
  "/model-galleries/Stirling/1.stirling-kitchen.jpg",
  "/model-galleries/Naples/Naples-Exterior-1.jpg",
  "/model-galleries/Stirling/16.stirling-dining.jpg",
  "/model-galleries/Big%20Sky/021-ascend-blue-sky-exterior3.jpg",
  "/model-galleries/Drake/710-embark-drake-exterior2.jpg",
  "/model-galleries/Crestwood/194-farmluxe-crestwood-exterior-2.jpg",
  "/model-galleries/Mckenna/021-foundation-mckenna-exterior.jpg",
  "/model-galleries/Sipsey/194-district-sipsey-exterior-elevation.jpg",
];

function Strip() {
  return (
    <div className="cta-strip" aria-hidden="true">
      <div className="cta-strip__track">
        {STRIP_IMAGES.map((src) => (
          <img key={src} src={src} alt="" loading="lazy" decoding="async" />
        ))}
        {STRIP_IMAGES.map((src) => (
          <img key={`${src}-2`} src={src} alt="" loading="lazy" decoding="async" />
        ))}
      </div>
    </div>
  );
}

export default function CTASection({
  eyebrow = "Ready when you are",
  title = "Let's find the right home for your budget and your land.",
  text = "Tell us what you're looking for and we'll send pricing, availability, and financing options — no pressure.",
}) {
  return (
    <section className="section">
      <div className="container">
        <div className="cta-band">
          <Strip />
          <p className="eyebrow" style={{ color: "var(--gold-soft)" }}>
            {eyebrow}
          </p>
          <h2>{title}</h2>
          <p>{text}</p>
          <div className="btn-row">
            <CTAButton to="/contact" variant="gold">
              Request Free Estimate
            </CTAButton>
            <CTAButton to="/financing" variant="ghost" style={{ color: "#fff", borderColor: "rgba(255,255,255,0.5)" }}>
              Financing Help
            </CTAButton>
          </div>
        </div>
      </div>
    </section>
  );
}
