import { Link } from "react-router-dom";
import Logo from "./Logo";
import { BUSINESS } from "../../data/business";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div>
            <div className="brand" style={{ color: "#fff", marginBottom: 12 }}>
              <Logo size={34} />
              <span style={{ color: "#fff" }}>
                Native Sun Homes
                <small style={{ color: "#9fb6cc" }}>{BUSINESS.tagline}</small>
              </span>
            </div>
            <p style={{ maxWidth: 300 }}>
              New manufactured homes tailored to your lifestyle and budget — built in
              partnership with Champion Homes and delivered with care. {BUSINESS.serviceArea}.
            </p>
          </div>

          <div>
            <h4>Shop</h4>
            <Link to="/homes">Our Homes</Link>
            <Link to="/floor-plans">Floor Plans</Link>
            <Link to="/category/has-tour">Virtual Tour Homes</Link>
            <Link to="/series">Browse by Series</Link>
            <Link to="/find">Find a Home</Link>
          </div>

          <div>
            <h4>Learn</h4>
            <Link to="/how-it-works">How Buying Works</Link>
            <Link to="/financing">Financing</Link>
            <Link to="/about">About Us</Link>
            <Link to="/contact">Contact Us</Link>
          </div>

          <div>
            <h4>Get in Touch</h4>
            <a href={BUSINESS.phoneHref}>{BUSINESS.phone}</a>
            <a href={BUSINESS.emailHref}>{BUSINESS.email}</a>
            <a href={BUSINESS.facebook} target="_blank" rel="noopener noreferrer">
              Follow on Facebook
            </a>
            <Link to="/contact">Request a Free Estimate</Link>
          </div>
        </div>

        <div className="footer__bottom">
          <span>© {new Date().getFullYear()} {BUSINESS.name}. All rights reserved.</span>
          <span>HUD-certified manufactured homes • {BUSINESS.serviceArea} • Financing assistance available</span>
        </div>
      </div>
    </footer>
  );
}
