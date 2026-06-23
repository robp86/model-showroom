import { SIZE_GROUPS } from "../../utils/sizeGroups";

// Sidebar filter controls. `set` merges a partial patch into the filter state.
export default function ModelFilters({ filters, set, seriesOptions, open }) {
  const toggle = (key) => set({ [key]: !filters[key] });

  return (
    <aside className={`filters${open ? " open" : ""}`}>
      <h4>Search</h4>
      <input
        type="text"
        placeholder="Name, series, feature…"
        value={filters.query}
        onChange={(e) => set({ query: e.target.value })}
      />

      <h4>Series</h4>
      <select value={filters.series} onChange={(e) => set({ series: e.target.value })}>
        <option value="">All series</option>
        {seriesOptions.map((s) => (
          <option key={s.slug} value={s.name}>
            {s.name} ({s.count})
          </option>
        ))}
      </select>

      <h4>Size</h4>
      <select value={filters.sizeGroup} onChange={(e) => set({ sizeGroup: e.target.value })}>
        <option value="">All sizes</option>
        {SIZE_GROUPS.map((g) => (
          <option key={g.id} value={g.label}>
            {g.label}
          </option>
        ))}
      </select>

      <h4>Bedrooms</h4>
      <select value={filters.beds} onChange={(e) => set({ beds: e.target.value })}>
        <option value="">Any</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4+</option>
      </select>

      <h4>Bathrooms</h4>
      <select value={filters.baths} onChange={(e) => set({ baths: e.target.value })}>
        <option value="">Any</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3+</option>
      </select>

      <h4>Show only</h4>
      <label className="check">
        <input type="checkbox" checked={filters.hasTour} onChange={() => toggle("hasTour")} />
        Homes with 3D tour
      </label>
      <label className="check">
        <input type="checkbox" checked={filters.hasFloorPlan} onChange={() => toggle("hasFloorPlan")} />
        Homes with floor plan
      </label>
      <label className="check">
        <input type="checkbox" checked={filters.moveInReady} onChange={() => toggle("moveInReady")} />
        Move-in ready
      </label>
      <label className="check">
        <input type="checkbox" checked={filters.featured} onChange={() => toggle("featured")} />
        Featured
      </label>

      <h4>Construction</h4>
      <select value={filters.sectionType} onChange={(e) => set({ sectionType: e.target.value })}>
        <option value="">Any</option>
        <option value="single-wide">Single-wide</option>
        <option value="double-wide">Double-wide</option>
        <option value="multi-section">Multi-section</option>
      </select>
    </aside>
  );
}
