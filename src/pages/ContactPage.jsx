import { useSearchParams } from "react-router-dom";
import Seo from "../components/Seo";
import ContactSection from "../components/layout/ContactSection";
import { BUSINESS } from "../data/business";

export default function ContactPage() {
  const [params] = useSearchParams();
  const model = params.get("model") || "";

  return (
    <div className="container section">
      <Seo
        title="Contact / Free Estimate"
        path="/contact"
        description="Contact Native Sun Homes LLC for pricing, financing, and a free estimate on manufactured & modular homes anywhere in Florida. Call (863) 263-4736."
      />
      <div className="grid-2">
        <div>
          <p className="eyebrow">Contact / Free Estimate</p>
          <h1>Ready to find your home?</h1>
          <p className="lead">
            {model
              ? `Interested in the ${model}? Send us a note and we'll get you pricing, financing options, and availability.`
              : "We specialize in new manufactured homes tailored to fit many lifestyles and budgets. Tell us what you're looking for — we'll help with pricing, financing, and a free estimate, no pressure."}
          </p>

          <div className="contact-lines">
            <p>
              <strong>Call us</strong>
              <a href={BUSINESS.phoneHref}>{BUSINESS.phone}</a>
            </p>
            <p>
              <strong>Email us</strong>
              <a href={BUSINESS.emailHref}>{BUSINESS.email}</a>
            </p>
            <p>
              <strong>Facebook</strong>
              <a href={BUSINESS.facebook} target="_blank" rel="noopener noreferrer">
                facebook.com/NativeSunHomes
              </a>
            </p>
            <p>
              <strong>Service area</strong>
              <span>{BUSINESS.serviceArea} — delivery &amp; installation available</span>
            </p>
          </div>

          <ul className="features-list" style={{ marginTop: 18 }}>
            <li>📞 Real people, fast replies</li>
            <li>💵 Financing assistance</li>
            <li>📐 Free estimates</li>
            <li>🚚 Delivery &amp; setup statewide</li>
          </ul>
        </div>

        <ContactSection defaultModel={model} />
      </div>
    </div>
  );
}
