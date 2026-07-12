import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

// Generic homepage section: eyebrow + title + optional "view all" link + body.
// Sections below the fold get a one-time fade-up as they scroll into view.
// The hidden state never persists in the DOM (the reveal is an animation
// added on entry), so prerendered/no-JS pages always show full content.
export default function HomeSection({
  eyebrow,
  title,
  subtitle,
  viewAllTo,
  viewAllLabel = "View all",
  variant,
  children,
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Already on screen (or above it) — don't animate content the user has seen.
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("section--reveal");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -60px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} className={`section${variant ? ` section--${variant}` : ""}`}>
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
