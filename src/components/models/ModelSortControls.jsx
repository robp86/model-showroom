import { SORT_OPTIONS } from "../../utils/modelFilters";

export default function ModelSortControls({ value, onChange }) {
  return (
    <div className="sort-control">
      <label htmlFor="sort" className="muted" style={{ fontWeight: 600 }}>
        Sort
      </label>
      <select id="sort" value={value} onChange={(e) => onChange(e.target.value)}>
        {SORT_OPTIONS.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
