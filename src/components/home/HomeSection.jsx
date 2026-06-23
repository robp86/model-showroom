import { Link } from "react-router-dom";

// Generic homepage section: eyebrow + title + optional "view all" link + body.
export default function HomeSection({
  eyebrow,
  title,
  subtitle,
  viewAllTo,
  viewAllLabel = "View all",
  variant,
  children,
}) {
  return (
    <section className={`section${variant ? ` section--${variant}` : ""}`}>
      <div className="container">
        <div className="section-head">
          <div>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {viewAllTo && (
            <Link to={viewAllTo} className="btn btn--ghost btn--sm">
              {viewAllLabel} →
            </Link>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}
