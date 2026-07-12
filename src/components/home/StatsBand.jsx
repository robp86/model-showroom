import { useEffect, useRef, useState } from "react";
import { useModels } from "../../hooks/useModels";

// Count-up stat. Renders the final value by default (so prerendered/no-JS
// pages always show real numbers) and only plays the count the first time the
// stat scrolls into view.
function Stat({ value, suffix = "", label }) {
  const ref = useRef(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return; // already seen
    let raf;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const dur = 1400;
      const tick = (now) => {
        const t = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
        setDisplay(Math.round(value * eased));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);

  return (
    <div ref={ref} className="stat">
      <span className="stat__num">
        {display}
        {suffix}
      </span>
      <span className="stat__label">{label}</span>
    </div>
  );
}

export default function StatsBand() {
  const { models, series, total } = useModels();
  const tours = models.filter((m) => m.buyerTags.includes("virtual-tour")).length;

  return (
    <section className="section section--tight" aria-label="Showroom at a glance">
      <div className="container">
        <div className="stats-band">
          <Stat value={total} suffix="+" label="Home models" />
          <Stat value={series.length} label="Collections" />
          <Stat value={tours} label="3D virtual tours" />
        </div>
      </div>
    </section>
  );
}
