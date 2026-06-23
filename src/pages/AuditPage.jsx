import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import audit from "../data/media-audit.generated.json";

const STATS = [
  ["totalModels", "Total models"],
  ["completeProfiles", "Complete profiles"],
  ["missingPhotos", "Missing photos"],
  ["missingFloorPlan", "Missing floor plan"],
  ["missingVirtualTour", "Missing 3D tour"],
  ["floorPlanOnly", "Floor plan only"],
  ["minimalOrBare", "Minimal / bare"],
  ["fromGalleryOnly", "Gallery-only (no specs)"],
];

export default function AuditPage() {
  const [q, setQ] = useState("");
  const [tier, setTier] = useState("");

  const rows = useMemo(() => {
    return audit.models.filter((m) => {
      if (tier && m.mediaTier !== tier) return false;
      if (q && !`${m.name} ${m.series}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [q, tier]);

  return (
    <div className="container section">
      <Seo title="Media Audit" path="/audit" noindex />
      <p className="eyebrow">Internal • Media Audit</p>
      <h1>Media Completeness Report</h1>
      <p className="muted">
        Generated {new Date(audit.generatedAt).toLocaleString()} •{" "}
        {audit.galleryFoldersScanned} gallery folders scanned • {audit.fromSpreadsheet}{" "}
        sheet rows.
      </p>

      <div className="audit-stats">
        {STATS.map(([k, label]) => (
          <div className="audit-stat" key={k}>
            <strong>{audit[k]}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {audit.noLocalFolder?.length > 0 && (
        <p className="muted">
          <strong>{audit.noLocalFolder.length}</strong> sheet rows had no matching
          local gallery folder. {audit.possibleUrlMismatch?.length || 0} possible
          folder mismatches flagged.
        </p>
      )}

      <div className="showroom__bar" style={{ marginTop: 16 }}>
        <input
          type="text"
          placeholder="Search models…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ padding: 9, borderRadius: 8, border: "1px solid var(--border-strong)", minWidth: 220 }}
        />
        <select value={tier} onChange={(e) => setTier(e.target.value)} style={{ padding: 9, borderRadius: 8 }}>
          <option value="">All tiers</option>
          <option value="complete">Complete</option>
          <option value="strong">Strong</option>
          <option value="partial">Partial</option>
          <option value="floor-plan-only">Floor plan only</option>
          <option value="minimal">Minimal</option>
          <option value="bare">Bare</option>
        </select>
        <span className="count">{rows.length} shown</span>
      </div>

      <div className="table-wrap" style={{ marginTop: 12, maxHeight: "70vh", overflowY: "auto" }}>
        <table className="audit-table">
          <thead>
            <tr>
              <th>Model</th>
              <th>Series</th>
              <th>Tier</th>
              <th>Score</th>
              <th>Photos</th>
              <th>Plan</th>
              <th>Tour</th>
              <th>Missing</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id}>
                <td><Link to={`/model/${m.id}`}>{m.name}</Link></td>
                <td>{m.series}</td>
                <td>{m.mediaTierLabel}</td>
                <td>{m.mediaScore}</td>
                <td>{m.photos}</td>
                <td>{m.hasFloorPlan ? "✓" : "—"}</td>
                <td>{m.hasVirtualTour ? "✓" : "—"}</td>
                <td>{m.missing.join(", ") || "—"}</td>
                <td>{m.sourceUrl ? <a href={m.sourceUrl} target="_blank" rel="noreferrer">page</a> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
