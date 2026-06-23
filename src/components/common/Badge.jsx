export default function Badge({ variant = "muted", children, title }) {
  return (
    <span className={`badge badge--${variant}`} title={title}>
      {children}
    </span>
  );
}
