// Warm branded placeholder shown when a model has no usable image.
export default function PlaceholderImage({ name, note = "Photos coming soon" }) {
  return (
    <div className="placeholder">
      <span className="placeholder__sun" aria-hidden="true" />
      <strong>{name}</strong>
      <small>{note}</small>
    </div>
  );
}
