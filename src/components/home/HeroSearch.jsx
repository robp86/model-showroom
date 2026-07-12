import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CTAButton from "../common/CTAButton";

// Hand-picked exterior shots for the rotating hero backdrop. First entry is
// the long-standing Stagg header so the initial paint doesn't change.
const HERO_IMAGES = [
  "/model-galleries/Stagg/00header%20021-foundation-stagg-exterior.%20header.jpg",
  "/model-galleries/Vienna%202.0/021-ascend-vienna-2-exterior-rendering-hr.jpg",
  "/model-galleries/Crestwood/194-farmluxe-crestwood-exterior-1.jpg",
  "/model-galleries/Silver%20Springs%20(25)/Silver%20Springs%20Elite%206400/Silver-Springs-Elite-6400-Exterior-9.jpg",
  "/model-galleries/Icon%20(5)/Icon%203256/050-icon-3256529-exterior-1-edit.jpg",
];

export default function HeroSearch() {
  const navigate = useNavigate();
  // prev stays mounted so the outgoing slide can crossfade underneath.
  const [slide, setSlide] = useState({ idx: 0, prev: null });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(
      () => setSlide((s) => ({ idx: (s.idx + 1) % HERO_IMAGES.length, prev: s.idx })),
      7000
    );
    return () => clearInterval(t);
  }, []);

  // Warm the cache for the upcoming slide so the crossfade never pops.
  useEffect(() => {
    const img = new Image();
    img.src = HERO_IMAGES[(slide.idx + 1) % HERO_IMAGES.length];
  }, [slide.idx]);
  const [beds, setBeds] = useState("");
  const [baths, setBaths] = useState("");
  const [size, setSize] = useState("");
  const [q, setQ] = useState("");

  function search(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (beds) params.set("beds", beds);
    if (baths) params.set("baths", baths);
    if (size) {
      const [min, max] = size.split("-");
      if (min) params.set("min", min);
      if (max) params.set("max", max);
    }
    if (q.trim()) params.set("q", q.trim());
    navigate(`/homes?${params.toString()}`);
  }

  return (
    <section className="hero">
      <div className="hero__bg" aria-hidden="true">
        {HERO_IMAGES.map((src, i) =>
          i === slide.idx || i === slide.prev ? (
            <div
              key={src}
              className={`hero__slide${i === slide.idx ? " is-active" : ""}`}
              style={{ backgroundImage: `url("${src}")` }}
            />
          ) : null
        )}
        <div className="hero__scrim" />
      </div>
      <div className="container hero__inner">
        <p className="eyebrow" style={{ color: "var(--gold-soft)" }}>
          Native Sun Homes • Manufactured Home Showroom
        </p>
        <h1>Find the manufactured home that fits your life.</h1>
        <p className="lead">
          Affordable, customizable, move-in-ready homes for families — browse
          floor plans, tour homes, and get honest pricing from a local dealer who
          actually picks up the phone.
        </p>

        <form className="searchbar" onSubmit={search}>
          <label>
            Bedrooms
            <select value={beds} onChange={(e) => setBeds(e.target.value)}>
              <option value="">Any</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>
          </label>
          <label>
            Bathrooms
            <select value={baths} onChange={(e) => setBaths(e.target.value)}>
              <option value="">Any</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3+</option>
            </select>
          </label>
          <label>
            Size
            <select value={size} onChange={(e) => setSize(e.target.value)}>
              <option value="">Any size</option>
              <option value="0-999">Under 1,000 sq ft</option>
              <option value="1000-1499">1,000–1,499</option>
              <option value="1500-1999">1,500–1,999</option>
              <option value="2000-">2,000+</option>
            </select>
          </label>
          <label>
            Keyword
            <input
              type="text"
              placeholder="Series or name…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
          <button type="submit" className="btn btn--primary">
            Search Homes
          </button>
        </form>

        <div className="btn-row">
          <CTAButton to="/homes" variant="gold">
            View Homes
          </CTAButton>
          <CTAButton to="/find" variant="green">
            Find My Floor Plan
          </CTAButton>
          <CTAButton
            to="/contact"
            variant="ghost"
            style={{ color: "#fff", borderColor: "rgba(255,255,255,0.55)" }}
          >
            Request Free Estimate
          </CTAButton>
        </div>
      </div>
    </section>
  );
}
