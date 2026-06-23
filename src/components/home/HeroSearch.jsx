import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CTAButton from "../common/CTAButton";

export default function HeroSearch() {
  const navigate = useNavigate();
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
