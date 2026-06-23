import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import Seo from "../components/Seo";
import Showroom from "../components/models/Showroom";
import { useModels } from "../hooks/useModels";
import { getCategory } from "../data/categories";

export default function CategoryPage() {
  const { id } = useParams();
  const { models } = useModels();
  const category = getCategory(id);

  const baseModels = useMemo(
    () => (category ? models.filter(category.match) : []),
    [models, category]
  );

  if (!category) {
    return (
      <div className="container section">
        <h2>Category not found</h2>
        <p className="muted">That collection doesn't exist.</p>
        <Link className="btn btn--primary" to="/homes">
          Browse all homes
        </Link>
      </div>
    );
  }

  return (
    <>
      <Seo
        title={category.label}
        path={`/category/${category.id}`}
        description={`${category.label}: ${category.blurb} Browse manufactured & modular homes from Native Sun Homes, serving all of Florida.`}
      />
      <Showroom baseModels={baseModels} title={category.label} subtitle={category.blurb} />
    </>
  );
}
