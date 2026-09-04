import { useEffect, useRef, useState } from "react";

/* ── Scroll reveal ─────────────────────────────────────────────────────
   The classic "content rises into place as you scroll" effect. An
   IntersectionObserver flips a class the first time an element crosses
   into view; the transition itself lives in index.css (.cg-reveal*), so
   nothing animates for visitors who ask for reduced motion.

   <Reveal>            one element
   <RevealGroup>       a container whose direct children reveal in sequence
   ──────────────────────────────────────────────────────────────────── */

const OBSERVER_OPTS = { threshold: 0.08, rootMargin: "0px 0px -60px 0px" };

/* Wraps a single block and reveals it once it scrolls into view. */
export default function Reveal({
  children,
  as: Tag = "div",
  variant = "up",
  delay = 0,
  className = "",
  style,
  ...rest
}) {
  const ref = useRef(null);
  /* No observer (a very old browser) — start revealed rather than invisible. */
  const [shown, setShown] = useState(() => typeof IntersectionObserver === "undefined");

  useEffect(() => {
    const el = ref.current;
    if (!el || shown) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { setShown(true); io.unobserve(entry.target); }
      });
    }, OBSERVER_OPTS);

    io.observe(el);
    return () => io.disconnect();
  }, [shown]);

  return (
    <Tag
      ref={ref}
      className={`cg-reveal cg-reveal-${variant}${shown ? " cg-reveal-in" : ""}${className ? ` ${className}` : ""}`}
      style={delay ? { transitionDelay: `${delay}ms`, ...style } : style}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* Reveals each direct child in turn, `stagger` ms apart. Handy for lists
   and card grids, where wrapping every item by hand would be noise. */
export function RevealGroup({
  children,
  as: Tag = "div",
  variant = "up",
  delay = 0,
  stagger = 90,
  className = "",
  ...rest
}) {
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const items = Array.from(root.children);
    if (!items.length) return;

    const reveal = (el) => el.classList.add("cg-reveal-in");

    items.forEach((el, i) => {
      el.classList.add("cg-reveal", `cg-reveal-${variant}`);
      el.style.transitionDelay = `${delay + i * stagger}ms`;
    });

    if (typeof IntersectionObserver === "undefined") { items.forEach(reveal); return; }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { reveal(entry.target); io.unobserve(entry.target); }
      });
    }, OBSERVER_OPTS);

    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [variant, delay, stagger]);

  return (
    <Tag ref={ref} className={className} {...rest}>
      {children}
    </Tag>
  );
}
