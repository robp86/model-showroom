import { useEffect, useRef, useState } from "react";

// Showroom ticker: a row that drifts sideways on its own, like a slow
// conveyor. Content is rendered twice so the loop wraps invisibly; motion
// pauses while the user hovers, touches, drags or focuses the row, and the
// row stays a normal manual scroller for reduced-motion users (no clones).
export default function TickerRow({ children, speed = 24 }) {
  const ref = useRef(null);
  const [active, setActive] = useState(false);

  // Only clone + animate when motion is allowed and the row actually
  // overflows — otherwise leave the plain scroll row untouched.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.scrollWidth <= el.clientWidth + 40) return;
    setActive(true);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || !active) return;

    let raf;
    let pos = el.scrollLeft;
    let last = performance.now();
    let hovered = false;
    let focused = false;
    let inView = true;
    let holdUntil = 0; // cooldown after wheel/drag so we don't fight the user

    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
    });
    io.observe(el);

    const step = (now) => {
      const dt = Math.min(now - last, 100) / 1000;
      last = now;
      const half = el.scrollWidth / 2;
      const running =
        inView && !hovered && !focused && now >= holdUntil && half > el.clientWidth;
      if (running) {
        // adopt any manual scrolling that happened while paused
        if (Math.abs(el.scrollLeft - pos) > 2) pos = el.scrollLeft;
        pos += speed * dt;
        if (pos >= half) pos -= half;
        el.scrollLeft = pos;
      } else {
        pos = el.scrollLeft;
        // keep the loop seamless even while the user drags past the seam
        if (pos >= half) {
          pos -= half;
          el.scrollLeft = pos;
        }
      }
      raf = requestAnimationFrame(step);
    };

    const hold = (ms) => {
      holdUntil = Math.max(holdUntil, performance.now() + ms);
    };
    const onEnter = () => (hovered = true);
    const onLeave = () => {
      hovered = false;
      hold(1200); // let touch momentum settle before resuming
    };
    const onFocusIn = () => (focused = true);
    const onFocusOut = () => (focused = false);
    const onWheel = () => hold(2000);
    const onPointerDown = () => hold(2000);

    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("focusin", onFocusIn);
    el.addEventListener("focusout", onFocusOut);
    el.addEventListener("wheel", onWheel, { passive: true });
    el.addEventListener("pointerdown", onPointerDown);
    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("focusin", onFocusIn);
      el.removeEventListener("focusout", onFocusOut);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onPointerDown);
    };
  }, [active, speed]);

  return (
    <div ref={ref} className={`row-scroll${active ? " row-scroll--ticker" : ""}`}>
      {children}
      {active && (
        <div className="ticker-clone" inert aria-hidden="true">
          {children}
        </div>
      )}
    </div>
  );
}
