// Customer testimonials — HIDDEN until real quotes are supplied.
//
// IMPORTANT: only ever publish real, verifiable customer reviews (FTC
// endorsement rules; fabricated testimonials are illegal and brand-fatal).
// To go live: replace the placeholder entries below with real quotes (and,
// ideally, a real customer/home photo per entry), then set SHOW to true.
const SHOW = false;

const TESTIMONIALS = [
  {
    quote: "[PLACEHOLDER — real customer quote goes here]",
    name: "[Customer name]",
    detail: "[Model purchased · County]",
    photo: null, // optional: "/images/testimonials/<file>.jpg" (real photo only)
  },
  {
    quote: "[PLACEHOLDER — real customer quote goes here]",
    name: "[Customer name]",
    detail: "[Model purchased · County]",
    photo: null,
  },
  {
    quote: "[PLACEHOLDER — real customer quote goes here]",
    name: "[Customer name]",
    detail: "[Model purchased · County]",
    photo: null,
  },
];

export default function Testimonials() {
  if (!SHOW) return null;
  return (
    <section className="section section--cream">
      <div className="container">
        <div className="section-head">
          <div>
            <p className="eyebrow">Real families, real homes</p>
            <h2>What Our Customers Say</h2>
          </div>
        </div>
        <div className="testimonial-grid">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="testimonial">
              <blockquote>“{t.quote}”</blockquote>
              <figcaption>
                {t.photo && <img src={t.photo} alt={t.name} loading="lazy" />}
                <span>
                  <strong>{t.name}</strong>
                  <small>{t.detail}</small>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
