import { useMemo } from "react";
import ModelGrid from "./ModelGrid";
import { defaultCompare } from "../../utils/modelFilters";

// Score how related another model is to the current one.
function relatedness(a, b) {
  let score = 0;
  if (a.series === b.series && a.series !== "Other Models") score += 4;
  if (a.beds === b.beds) score += 2;
  if (a.baths === b.baths) score += 1;
  if (a.sqft && b.sqft && Math.abs(a.sqft - b.sqft) <= a.sqft * 0.15) score += 2;
  if (a.media.mediaTier === b.media.mediaTier) score += 1;
  return score;
}

export default function SimilarHomes({ model, models, count = 4 }) {
  const similar = useMemo(() => {
    return models
      .filter((m) => m.id !== model.id)
      .map((m) => ({ m, r: relatedness(model, m) }))
      .filter((x) => x.r > 0)
      .sort((a, b) => b.r - a.r || defaultCompare(a.m, b.m))
      .slice(0, count)
      .map((x) => x.m);
  }, [model, models, count]);

  if (similar.length === 0) return null;

  return (
    <section className="section section--cream">
      <div className="container">
        <div className="section-head">
          <div>
            <p className="eyebrow">You might also like</p>
            <h2>Similar Homes</h2>
          </div>
        </div>
        <ModelGrid models={similar} />
      </div>
    </section>
  );
}
