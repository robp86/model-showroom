// Authority-transfer strip: the trust claims already made in body copy
// (Champion partnership, HUD code, statewide setup, financing help) rendered
// as a visual badge row where it counts — right under the hero, before the
// first ask. Every claim here must stay true and verifiable.
const BADGES = [
  { icon: "🏭", label: "Champion Homes Partner", sub: "70+ years of building" },
  { icon: "🏠", label: "HUD-Certified Homes", sub: "Federal construction code" },
  { icon: "🚚", label: "Statewide Delivery & Setup", sub: "All of Florida" },
  { icon: "💰", label: "Financing Assistance", sub: "Payments often comparable to rent" },
];

export default function TrustStrip() {
  return (
    <div className="trust-strip" role="list" aria-label="Why buy from Native Sun Homes">
      <div className="container trust-strip__inner">
        {BADGES.map((b) => (
          <div key={b.label} className="trust-strip__item" role="listitem">
            <span className="trust-strip__icon" aria-hidden="true">
              {b.icon}
            </span>
            <span>
              <strong>{b.label}</strong>
              <small>{b.sub}</small>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
