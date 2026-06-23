import { Link } from "react-router-dom";
import PlaceholderImage from "../common/PlaceholderImage";
import MediaBadges from "./MediaBadges";
import { specsLine } from "../../utils/modelDisplay";

// Hero photo, else floor plan, else branded placeholder.
function cardImage(model) {
  if (model.media.heroImage) return { src: model.media.heroImage, kind: "hero" };
  if (model.media.floorPlans[0]) return { src: model.media.floorPlans[0], kind: "plan" };
  return null;
}

export default function ModelCard({ model }) {
  const img = cardImage(model);

  return (
    <article className="model-card">
      <Link to={`/model/${model.id}`} className="model-card__media">
        {img ? (
          <img src={img.src} alt={model.name} loading="lazy" decoding="async" />
        ) : (
          <PlaceholderImage name={model.name} />
        )}
      </Link>

      <div className="model-card__body">
        <span className="model-card__series">{model.series}</span>
        <h3 className="model-card__name">
          <Link to={`/model/${model.id}`}>{model.name}</Link>
        </h3>
        <p className="model-card__specs">{specsLine(model)}</p>

        <MediaBadges model={model} limit={4} />

        <div className="model-card__actions">
          <Link className="btn btn--primary btn--sm" to={`/model/${model.id}`}>
            View Home
          </Link>
          <Link
            className="btn btn--ghost btn--sm"
            to={`/contact?model=${encodeURIComponent(model.name)}`}
          >
            Ask About
          </Link>
        </div>
      </div>
    </article>
  );
}
