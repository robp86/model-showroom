import CTAButton from "../common/CTAButton";

export default function CTASection({
  eyebrow = "Ready when you are",
  title = "Let's find the right home for your budget and your land.",
  text = "Tell us what you're looking for and we'll send pricing, availability, and financing options — no pressure.",
}) {
  return (
    <section className="section">
      <div className="container">
        <div className="cta-band">
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
