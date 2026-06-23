import { useMemo, useState } from "react";
import ModelGrid from "./ModelGrid";
import ModelFilters from "./ModelFilters";
import ModelSortControls from "./ModelSortControls";
import EmptyState from "../common/EmptyState";
import { buildSeries } from "../../data/categories";
import {
  EMPTY_FILTERS,
  filterModels,
  sortModels,
  countActiveFilters,
} from "../../utils/modelFilters";

function activeChips(filters, set) {
  const chips = [];
  const add = (key, label, clear) => chips.push({ key, label, clear });
  if (filters.query) add("query", `“${filters.query}”`, () => set({ query: "" }));
  if (filters.series) add("series", filters.series, () => set({ series: "" }));
  if (filters.sizeGroup) add("sizeGroup", filters.sizeGroup, () => set({ sizeGroup: "" }));
  if (filters.beds) add("beds", `${filters.beds === "4" ? "4+" : filters.beds} bd`, () => set({ beds: "" }));
  if (filters.baths) add("baths", `${filters.baths === "3" ? "3+" : filters.baths} ba`, () => set({ baths: "" }));
  if (filters.minSqft) add("minSqft", `≥ ${filters.minSqft} sqft`, () => set({ minSqft: "" }));
  if (filters.maxSqft) add("maxSqft", `≤ ${filters.maxSqft} sqft`, () => set({ maxSqft: "" }));
  for (const [k, label] of [
    ["hasFloorPlan", "Has floor plan"],
    ["hasTour", "Has 3D tour"],
    ["moveInReady", "Move-in ready"],
    ["featured", "Featured"],
    ["bestSeller", "Best seller"],
    ["newArrival", "New arrival"],
  ]) {
    if (filters[k]) add(k, label, () => set({ [k]: false }));
  }
  if (filters.sectionType) add("sectionType", filters.sectionType, () => set({ sectionType: "" }));
  return chips;
}

export default function Showroom({
  baseModels,
  title,
  subtitle,
  initialFilters,
  initialSort = "best-match",
}) {
  const PAGE = 24;
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS, ...initialFilters });
  const [sort, setSort] = useState(initialSort);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [limit, setLimit] = useState(PAGE);

  const set = (patch) => {
    setLimit(PAGE);
    setFilters((f) => ({ ...f, ...patch }));
  };
  const reset = () => {
    setLimit(PAGE);
    setFilters({ ...EMPTY_FILTERS });
  };

  const seriesOptions = useMemo(() => buildSeries(baseModels), [baseModels]);
  const results = useMemo(() => {
    const filtered = filterModels(baseModels, filters);
    return sortModels(filtered, sort);
  }, [baseModels, filters, sort]);
  const shown = results.slice(0, limit);

  const chips = activeChips(filters, set);
  const activeCount = countActiveFilters(filters);

  return (
    <div className="container section">
      <div className="section-head">
        <div>
          <p className="eyebrow">Showroom</p>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>

      <div className="showroom">
        <ModelFilters
          filters={filters}
          set={set}
          seriesOptions={seriesOptions}
          open={filtersOpen}
        />

        <div className="showroom__main">
          <div className="showroom__bar">
            <button
              className="btn btn--ghost btn--sm filter-toggle"
              onClick={() => setFiltersOpen((o) => !o)}
            >
              ☰ Filters{activeCount ? ` (${activeCount})` : ""}
            </button>
            <span className="count">
              {results.length} home{results.length === 1 ? "" : "s"}
            </span>
            <ModelSortControls value={sort} onChange={setSort} />
          </div>

          {chips.length > 0 && (
            <div className="chips">
              {chips.map((c) => (
                <span className="chip" key={c.key}>
                  {c.label}
                  <button onClick={c.clear} aria-label={`Remove ${c.label}`}>
                    ×
                  </button>
                </span>
              ))}
              <button className="chip" onClick={reset}>
                Clear all
              </button>
            </div>
          )}

          {results.length === 0 ? (
            <EmptyState actionLabel="Clear filters" onAction={reset} />
          ) : (
            <>
              <ModelGrid models={shown} />
              {results.length > limit && (
                <div className="center" style={{ marginTop: 28 }}>
                  <button
                    className="btn btn--ghost"
                    onClick={() => setLimit((l) => l + PAGE)}
                  >
                    Show more homes ({results.length - limit} more)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
