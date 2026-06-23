import { Link } from "react-router-dom";
import { NAV_LINKS } from "./nav";

export default function MobileMenu({ open, onClose }) {
  return (
    <div className={`mobile-menu${open ? " open" : ""}`}>
      <div className="container">
        {NAV_LINKS.map((l) => (
          <Link key={l.to} to={l.to} onClick={onClose}>
            {l.label}
          </Link>
        ))}
        <Link className="btn btn--gold" to="/contact" onClick={onClose}>
          Request Free Estimate
        </Link>
      </div>
    </div>
  );
}
