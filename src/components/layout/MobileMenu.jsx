import { Link } from "react-router-dom";
import { NAV_LINKS } from "./nav";
import { MAIN_SITE_URL, SERVICE_AREAS_URL } from "../../data/business";

export default function MobileMenu({ open, onClose }) {
  return (
    <div className={`mobile-menu${open ? " open" : ""}`}>
      <div className="container">
        {NAV_LINKS.map((l) => (
          <Link key={l.to} to={l.to} onClick={onClose}>
            {l.label}
          </Link>
        ))}
        <a href={MAIN_SITE_URL} onClick={onClose}>
          Main Site ↗
        </a>
        <a href={SERVICE_AREAS_URL} onClick={onClose}>
          Service Areas ↗
        </a>
        <Link className="btn btn--gold" to="/contact" onClick={onClose}>
          Request Free Estimate
        </Link>
      </div>
    </div>
  );
}
