/* Admin-entered links (event CTAs, banners) are typed by hand, so they arrive in
   whatever shape the browser bar showed: "/products", a full URL to this very
   site, or a genuinely external link.

   resolveLink normalises all three. Same-origin absolute URLs are turned back
   into router paths so they navigate in-app instead of reloading the whole
   bundle — and so a link pasted while running on localhost still works once the
   site is on its real domain. Anything else is reported as external, for a
   plain anchor.

   Returns null for empty or unparseable input, so callers can simply hide the
   link rather than render a dead one. */
export const resolveLink = (link) => {
  const raw = String(link || "").trim();
  if (!raw) return null;
  if (raw.startsWith("/")) return { to: raw, external: false };
  try {
    const url = new URL(raw);
    if (url.origin === window.location.origin) {
      return { to: `${url.pathname}${url.search}${url.hash}`, external: false };
    }
    return { to: raw, external: true };
  } catch {
    return null;
  }
};
