/* Fly-to-cart: the quiet confirmation that replaces the add-to-cart toast.
   A clone of the product image arcs into whichever cart icon is on screen
   (desktop navbar or mobile tab bar) and the icon gives one short pulse.
   Deliberately brief — ~520ms — so it reads as feedback, not as a cutscene. */

const REDUCED = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/* Both nav bars mark their cart button with data-cart-target; only one of
   them is ever laid out, so pick the first with a real box. */
function findCartTarget() {
  const targets = document.querySelectorAll("[data-cart-target]");
  for (const el of targets) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
}

function pulse(el) {
  el.animate(
    [
      { transform: "scale(1)" },
      { transform: "scale(1.28)" },
      { transform: "scale(0.94)" },
      { transform: "scale(1)" },
    ],
    { duration: 420, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" }
  );
}

/**
 * @param {HTMLElement|null} sourceEl  image (or card) the product flies from
 */
export function flyToCart(sourceEl) {
  const target = findCartTarget();
  if (!target) return;

  if (!sourceEl || REDUCED() || typeof sourceEl.animate !== "function") {
    pulse(target);
    return;
  }

  const from = sourceEl.getBoundingClientRect();
  if (!from.width || !from.height) {
    pulse(target);
    return;
  }
  const to = target.getBoundingClientRect();

  /* Cap the flyer so a large gallery image doesn't launch a billboard. */
  const size = Math.min(from.width, from.height, 96);
  const startX = from.left + from.width / 2 - size / 2;
  const startY = from.top + from.height / 2 - size / 2;
  const dx = to.left + to.width / 2 - (startX + size / 2);
  const dy = to.top + to.height / 2 - (startY + size / 2);

  const src = sourceEl.tagName === "IMG" ? sourceEl.src : sourceEl.querySelector("img")?.src;

  const flyer = document.createElement("div");
  flyer.style.cssText = `
    position:fixed; left:${startX}px; top:${startY}px;
    width:${size}px; height:${size}px;
    border-radius:16px; overflow:hidden; z-index:2000;
    pointer-events:none; will-change:transform,opacity;
    background:#f1f5f8 ${src ? `center/cover url("${src.replace(/"/g, '\\"')}")` : ""};
    box-shadow:0 12px 30px -12px rgba(0,0,0,0.45);
  `;
  document.body.appendChild(flyer);

  /* Slight lift at the halfway point gives the path an arc rather than a
     straight slide, which is what makes the motion read as "into the cart". */
  const anim = flyer.animate(
    [
      { transform: "translate(0,0) scale(1)", opacity: 1, borderRadius: "16px" },
      {
        transform: `translate(${dx * 0.55}px, ${dy * 0.4 - 40}px) scale(0.6)`,
        opacity: 0.85,
        offset: 0.55,
      },
      {
        transform: `translate(${dx}px, ${dy}px) scale(0.12)`,
        opacity: 0.15,
        borderRadius: "50%",
      },
    ],
    { duration: 520, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" }
  );

  anim.onfinish = () => {
    flyer.remove();
    pulse(target);
  };
  anim.oncancel = () => flyer.remove();
}

export default flyToCart;
