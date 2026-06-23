import { useMemo } from "react";
import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import HeroSearch from "../components/home/HeroSearch";
import BuyerPathCards from "../components/home/BuyerPathCards";
import HomeSection from "../components/home/HomeSection";
import ModelGrid from "../components/models/ModelGrid";
import CTASection from "../components/layout/CTASection";
import { useModels } from "../hooks/useModels";
import { SIZE_GROUPS } from "../utils/sizeGroups";

// Round-robin models by series so consecutive homes are from different
// collections — showcases the breadth of the lineup instead of repeating the
// same few models across sections.
function diversifyBySeries(models) {
  const groups = new Map();
  for (const m of models) {
    const k = m.series || "Other Models";
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(m);
  }
  const lists = [...groups.values()];
  const out = [];
  for (let i = 0; out.length < models.length; i++) {
    let added = false;
    for (const list of lists) {
      if (list[i]) {
        out.push(list[i]);
        added = true;
      }
    }
    if (!added) break;
  }
  return out;
}

function Tiles({ items }) {
  return (
    <div className="tile-grid">
      {items.map((t) => (
        <Link key={t.to} to={t.to} className={`tile${t.variant ? ` tile--${t.variant}` : ""}`}>
          {t.label}
          {t.count != null && <span className="tile__count">{t.count} homes</span>}
        </Link>
      ))}
    </div>
  );
}

const STEPS = [
  { n: "1", t: "Explore models", d: "Browse floor plans, photos and 3D tours." },
  { n: "2", t: "Talk to us", d: "Get pricing, options and financing guidance." },
  { n: "3", t: "Plan your land", d: "Own land or need help? We'll walk you through it." },
  { n: "4", t: "Delivery & setup", d: "We coordinate delivery, setup and final touches." },
];

export default function HomePage() {
  const { models, series, categoryCounts, total } = useModels();

  // Three distinct, series-diverse line-ups: manually-tagged homes lead each
  // section, then the rest is filled from a series round-robin with a shared
  // "used" set so no model appears in more than one section.
  const { featured, bestSellers, newArrivals } = useMemo(() => {
    const diverse = diversifyBySeries(models);
    const used = new Set();
    const take = (pred, n) => {
      const out = [];
      for (const m of models) {
        if (out.length >= n) break;
        if (pred(m) && !used.has(m.id)) {
          out.push(m);
          used.add(m.id);
        }
      }
      for (const m of diverse) {
        if (out.length >= n) break;
        if (!used.has(m.id)) {
          out.push(m);
          used.add(m.id);
        }
      }
      return out;
    };
    return {
      featured: take((m) => m.businessTags.featured, 8),
      bestSellers: take((m) => m.businessTags.bestSeller, 8),
      newArrivals: take((m) => m.businessTags.newArrival, 8),
    };
  }, [models]);

  const bedroomTiles = [
    { label: "1 Bedroom", to: "/category/1-bedroom", count: categoryCounts["1-bedroom"] },
    { label: "2 Bedroom", to: "/category/2-bedroom", count: categoryCounts["2-bedroom"] },
    { label: "3 Bedroom", to: "/category/3-bedroom", count: categoryCounts["3-bedroom"] },
    { label: "4+ Bedroom", to: "/category/4-plus-bedroom", count: categoryCounts["4-plus-bedroom"] },
  ];
  const sizeTiles = SIZE_GROUPS.map((g) => ({
    label: g.label,
    to: `/category/${g.id}`,
    count: categoryCounts[g.id],
  }));
  const seriesTiles = series
    .filter((s) => s.name !== "Other Models")
    .slice(0, 12)
    .map((s) => ({ label: s.name, to: `/series/${s.slug}`, count: s.count }));

  return (
    <>
      <Seo
        path="/"
        description={`New manufactured & modular homes across all of Florida, in partnership with Champion Homes. Browse ${total}+ models, floor plans, and 3D tours from Native Sun Homes.`}
      />
      <HeroSearch />
      <BuyerPathCards />

      <HomeSection
        eyebrow="Showcase"
        title="Featured Homes"
        subtitle={`Hand-picked from ${total} models.`}
        viewAllTo="/homes"
        variant="cream"
      >
        <ModelGrid models={featured} scroll />
      </HomeSection>

      <HomeSection
        eyebrow="Popular"
        title="Best Sellers"
        subtitle="The floor plans buyers love most."
        viewAllTo="/category/best-sellers"
      >
        <ModelGrid models={bestSellers} scroll />
      </HomeSection>

      <HomeSection
        eyebrow="Just added"
        title="New Arrivals"
        subtitle="The newest models in the lineup."
        viewAllTo="/category/new-arrivals"
        variant="cream"
      >
        <ModelGrid models={newArrivals} scroll />
      </HomeSection>

      <HomeSection title="Shop by Series" subtitle="Explore homes by collection." viewAllTo="/series">
        {seriesTiles.length > 0 ? <Tiles items={seriesTiles} /> : null}
      </HomeSection>

      <HomeSection title="Shop by Size" variant="beige">
        <Tiles items={sizeTiles} />
      </HomeSection>

      <HomeSection title="Shop by Bedroom Count">
        <Tiles items={bedroomTiles} />
      </HomeSection>

      <HomeSection
        title="How Buying Works"
        subtitle="A simple, guided path to your new home."
        variant="cream"
        viewAllTo="/how-it-works"
        viewAllLabel="Learn more"
      >
        <div className="path-grid">
          {STEPS.map((s) => (
            <div key={s.n} className="path-card">
              <div className="icon" aria-hidden="true">
                {s.n}
              </div>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </div>
          ))}
        </div>
      </HomeSection>

      <CTASection />
    </>
  );
}
