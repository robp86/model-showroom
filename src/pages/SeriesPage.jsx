import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import Seo from "../components/Seo";
import Showroom from "../components/models/Showroom";
import { useModels } from "../hooks/useModels";
import { slugify } from "../utils/slugify";

export default function SeriesPage() {
  const { slug } = useParams();
  const { models } = useModels();

  const { name, baseModels } = useMemo(() => {
    const matches = models.filter((m) => slugify(m.series) === slug);
    return { name: matches[0]?.series || null, baseModels: matches };
  }, [models, slug]);

  if (!name) {
    return (
      <div className="container section">
        <h2>Series not found</h2>
        <Link className="btn btn--primary" to="/series">
          Browse all series
        </Link>
      </div>
    );
  }

  return (
    <>
      <Seo
        title={`${name} Series`}
        path={`/series/${slug}`}
        description={`Explore all ${baseModels.length} homes in the ${name} series from Native Sun Homes — floor plans, photos, and 3D tours. Serving all of Florida.`}
      />
      <Showroom
        baseModels={baseModels}
        title={`${name} Series`}
        subtitle={`All ${baseModels.length} homes in the ${name} series.`}
      />
    </>
  );
}
