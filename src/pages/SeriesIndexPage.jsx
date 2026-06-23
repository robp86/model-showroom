import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useModels } from "../hooks/useModels";
import Seo from "../components/Seo";
import PlaceholderImage from "../components/common/PlaceholderImage";

export default function SeriesIndexPage() {
  const { models, series } = useModels();

  const cards = useMemo(
    () =>
      series.map((s) => {
        const rep = models.find((m) => m.series === s.name && m.media.heroImage);
        return { ...s, image: rep?.media.heroImage || "" };
      }),
    [series, models]
  );

  return (
    <div className="container section">
      <Seo
        title="Home Series & Collections"
        path="/series"
        description="Browse Native Sun Homes by manufacturer series and collection — Champion Community, Silver Springs, Lake Manor, Prime, Palm Bay, and more. Serving all of Florida."
      />
      <div className="section-head">
        <div>
          <p className="eyebrow">Browse by Series</p>
          <h2>Home Series &amp; Collections</h2>
          <p>Explore homes grouped by their manufacturer series.</p>
        </div>
      </div>

      <div className="model-grid">
        {cards.map((s) => (
          <Link key={s.slug} to={`/series/${s.slug}`} className="model-card">
            <div className="model-card__media">
              {s.image ? (
                <img src={s.image} alt={s.name} loading="lazy" decoding="async" />
              ) : (
                <PlaceholderImage name={s.name} note="Explore series" />
              )}
            </div>
            <div className="model-card__body">
              <h3 className="model-card__name">{s.name}</h3>
              <p className="model-card__specs">
                {s.count} home{s.count === 1 ? "" : "s"}
              </p>
              <span className="btn btn--ghost btn--sm" style={{ marginTop: "auto" }}>
                View series →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
