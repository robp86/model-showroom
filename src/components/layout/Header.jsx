import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { PRIMARY_NAV } from "./nav";
import MobileMenu from "./MobileMenu";
import { BUSINESS, MAIN_SITE_URL } from "../../data/business";

export default function Header() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="header">
      <div className="container header__inner">
        <Link to="/" className="brand" aria-label="Native Sun Homes home" onClick={close}>
          <span className="brand__crop" aria-hidden="true" />
          <span>
            Native Sun Homes
            <small>Bringing your home straight to you</small>
          </span>
        </Link>

        <nav className="nav">
          {PRIMARY_NAV.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {l.label}
            </NavLink>
          ))}
          <a href={MAIN_SITE_URL} className="nav__external">
            Main Site ↗
          </a>
        </nav>

        <a href={BUSINESS.phoneHref} className="header__phone" aria-label={`Call ${BUSINESS.shortName} at ${BUSINESS.phone}`}>
          <span aria-hidden="true">📞</span>
          <span className="header__phone-num">{BUSINESS.phone}</span>
        </a>

        <Link to="/contact" className="btn btn--gold btn--sm header__cta">
          Free Estimate
        </Link>

        <button
          className="menu-toggle"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="Toggle menu"
        >
          ☰ Menu
        </button>
      </div>

      <MobileMenu open={open} onClose={() => setOpen(false)} />
    </header>
  );
}
