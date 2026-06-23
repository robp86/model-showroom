import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useModels } from "../hooks/useModels";
import Seo from "../components/Seo";
import Badge from "../components/common/Badge";
import PlaceholderImage from "../components/common/PlaceholderImage";
import MediaBadges from "../components/models/MediaBadges";
import MediaGallery from "../components/models/MediaGallery";
import FloorPlanViewer from "../components/models/FloorPlanViewer";
import VirtualTourEmbed from "../components/models/VirtualTourEmbed";
import SimilarHomes from "../components/models/SimilarHomes";

export default function ModelPage() {
  const { id } = useParams();
  const { byId, models } = useModels();
  const model = byId.get(id);

  // Only offer tabs that actually have content — never advertise what's missing.
  const tabs = useMemo(() => {
    if (!model) return [];
    const m = model.media;
    return [
      m.hasPhotos && { id: "photos", label: "Photos" },
      m.hasFloorPlan && { id: "floor", label: "Floor Plan" },
      m.hasVirtualTour && { id: "tour", label: "3D Tour" },
      m.hasVideo && { id: "video", label: "Video" },
      { id: "specs", label: "Specs" },
    ].filter(Boolean);
  }, [model]);

  const [tab, setTab] = useState(null);
  const activeTab = tab && tabs.some((t) => t.id === tab) ? tab : tabs[0]?.id;

  if (!model) {
    return (
      <div className="container section">
        <h2>Home not found</h2>
        <p className="muted">We couldn't find that model.</p>
        <Link className="btn btn--primary" to="/homes">
          Browse all homes
        </Link>
      </div>
    );
  }

  const { media } = model;
  const heroSrc = media.heroImage || media.floorPlans[0] || "";
  const askLink = `/contact?model=${encodeURIComponent(model.name)}`;

  const sqftStr = model.sqft ? model.sqft.toLocaleString() : "";
  const seriesSuffix = model.series && model.series !== "Other Models" ? ` (${model.series})` : "";
  const seoTitle = `${model.name} — ${model.beds || "?"} bed, ${model.baths || "?"} bath${
    sqftStr ? `, ${sqftStr} sq ft` : ""
  }`;
  const seoDesc =
    `${model.name}${seriesSuffix} manufactured home: ${model.beds || "?"} bed, ${model.baths || "?"} bath` +
    `${sqftStr ? `, ${sqftStr} sq ft` : ""}${media.hasVirtualTour ? ", 3D virtual tour" : ""}` +
    `${media.hasFloorPlan ? ", floor plan" : ""}. Serving all of Florida — contact Native Sun Homes for pricing.`;
  const residenceLd = {
    "@context": "https://schema.org",
    "@type": "SingleFamilyResidence",
    name: model.name,
    description: seoDesc,
    ...(heroSrc ? { image: heroSrc.startsWith("http") ? heroSrc : undefined } : {}),
    ...(model.beds ? { numberOfBedrooms: model.beds } : {}),
    ...(model.baths ? { numberOfBathroomsTotal: model.baths } : {}),
    ...(model.sqft
      ? { floorSize: { "@type": "QuantitativeValue", value: model.sqft, unitCode: "FTK" } }
      : {}),
    provider: {
      "@type": "HomeAndConstructionBusiness",
      name: "Native Sun Homes LLC",
      telephone: "+1-863-263-4736",
      areaServed: { "@type": "State", name: "Florida" },
    },
  };

  return (
    <>
      <Seo
        title={seoTitle}
        description={seoDesc}
        path={`/model/${model.id}`}
        type="product"
        image={media.heroImage || undefined}
        jsonLd={residenceLd}
      />
      <div className="container section">
        <p className="muted" style={{ fontSize: "0.85rem" }}>
          <Link to="/homes">All Models</Link> ›{" "}
          <Link to={`/series/${model.series ? model.series.toLowerCase().replace(/[^a-z0-9]+/g, "-") : ""}`}>
            {model.series}
          </Link>{" "}
          › {model.name}
        </p>

        <div className="detail-hero">
          <div className="detail-hero__media">
            {heroSrc ? (
              <img src={heroSrc} alt={model.name} />
            ) : (
              <PlaceholderImage name={model.name} />
            )}
          </div>

          <div className="detail-hero__info">
            <span className="model-card__series">{model.series}</span>
            <h1>{model.name}</h1>
            <div className="badge-row">
              <MediaBadges model={model} />
            </div>

            <div className="spec-strip">
              <div>
                <strong>{model.beds || "—"}</strong>
                <span>Beds</span>
              </div>
              <div>
                <strong>{model.baths || "—"}</strong>
                <span>Baths</span>
              </div>
              <div>
                <strong>{model.sqft ? model.sqft.toLocaleString() : "—"}</strong>
                <span>Sq Ft</span>
              </div>
              <div>
                <strong style={{ fontSize: "1rem" }}>{model.sectionType || "Manufactured"}</strong>
                <span>Type</span>
              </div>
            </div>

            <p className="muted">Contact us for current pricing and availability.</p>

            <div className="detail-cta">
              <div className="btn-row">
                <Link className="btn btn--primary" to={askLink}>
                  Request Pricing
                </Link>
                <Link className="btn btn--green" to={askLink}>
                  Schedule a Visit
                </Link>
              </div>
              <div className="btn-row">
                <Link className="btn btn--gold" to={askLink}>
                  Ask About This Home
                </Link>
                {model.sourceUrl && (
                  <a
                    className="btn btn--ghost"
                    href={model.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Manufacturer Page
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* media tabs */}
        <div style={{ marginTop: 36 }}>
          <div className="tabs">
            {tabs.map((t) => (
              <button
                key={t.id}
                className={activeTab === t.id ? "active" : ""}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === "photos" && <MediaGallery photos={media.photos} name={model.name} />}
          {activeTab === "floor" && <FloorPlanViewer floorPlans={media.floorPlans} name={model.name} />}
          {activeTab === "tour" && <VirtualTourEmbed tours={media.virtualTours} name={model.name} />}
          {activeTab === "video" &&
            media.videos.map((src, i) =>
              /youtube|youtu\.be|vimeo/i.test(src) ? (
                <iframe
                  key={i}
                  className="tour-frame"
                  src={src}
                  title={`${model.name} video ${i + 1}`}
                  allow="fullscreen"
                  allowFullScreen
                  style={{ marginBottom: 12 }}
                />
              ) : (
                <video
                  key={i}
                  src={src}
                  controls
                  style={{ width: "100%", borderRadius: 12, marginBottom: 12 }}
              />
            ))}
          {activeTab === "specs" && (
            <div className="grid-2">
              <table className="specs-table">
                <tbody>
                  <tr><td>Bedrooms</td><td>{model.beds || "Ask us"}</td></tr>
                  <tr><td>Bathrooms</td><td>{model.baths || "Ask us"}</td></tr>
                  <tr><td>Square Feet</td><td>{model.sqft ? model.sqft.toLocaleString() : "Ask us"}</td></tr>
                  <tr><td>Series</td><td>{model.series}</td></tr>
                  <tr><td>Section Type</td><td>{model.sectionType || "Manufactured"}</td></tr>
                  <tr><td>Construction</td><td>HUD-certified manufactured home</td></tr>
                </tbody>
              </table>
              <div>
                <h3>Features</h3>
                {model.features.length ? (
                  <ul className="features-list">
                    {model.features.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">
                    Feature details for this home are available on request — and many
                    options are customizable.
                  </p>
                )}
                {model.buyerTags.length > 0 && (
                  <div className="pill-row" style={{ marginTop: 12 }}>
                    {model.buyerTags.map((t) => (
                      <Badge key={t} variant="green">
                        {t.replace(/-/g, " ")}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <SimilarHomes model={model} models={models} />
    </>
  );
}
