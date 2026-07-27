/**
 * SVG handling helpers (pure, string-level).
 *
 * The real security boundary for SVG in this app is the *render path*: we
 * rasterize sanitized SVG through an `<img>` element, which the browser treats
 * as "secure static mode" — scripts never execute, external subresources are
 * blocked, and a same-origin blob does not taint the canvas. `sanitizeSvg` is
 * defense-in-depth on top of that: it strips the obvious active/embedded-content
 * vectors so nothing surprising survives even if the render path ever changes.
 */

/** A reference value we consider safe to keep: internal fragment or inline data. */
function isSafeRef(value: string): boolean {
  const v = value.trim().toLowerCase();
  return v.startsWith("#") || v.startsWith("data:");
}

export function sanitizeSvg(svg: string): string {
  let out = svg;

  // Remove <script> and <foreignObject> subtrees (open…close and self-closing).
  out = out.replace(/<script\b[\s\S]*?<\/script\s*>/gi, "");
  out = out.replace(/<script\b[^>]*\/>/gi, "");
  out = out.replace(/<foreignObject\b[\s\S]*?<\/foreignObject\s*>/gi, "");
  out = out.replace(/<foreignObject\b[^>]*\/>/gi, "");

  // Remove inline event-handler attributes (onload, onclick, …).
  out = out.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  // Drop href / xlink:href that point anywhere except an internal fragment or
  // a data: URI — i.e. any external (http, https, //, relative file) resource.
  out = out.replace(
    /\s(?:xlink:)?href\s*=\s*("([^"]*)"|'([^']*)')/gi,
    (match, _q, dq, sq) => {
      const value = dq !== undefined ? dq : sq;
      return isSafeRef(value) ? match : "";
    },
  );

  // Neutralize external url(...) references in presentation attrs / inline style,
  // keeping internal paint-server references like url(#gradient).
  out = out.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (match, _q, ref) => {
    return ref.trim().startsWith("#") ? match : "none";
  });

  return out;
}

const DEFAULT_SVG_SIZE = 512;

/** Parse a numeric length, rejecting percentages and other non-px units. */
function parseLength(raw: string | undefined): number | null {
  if (raw == null) return null;
  const t = raw.trim();
  if (t.endsWith("%")) return null;
  const m = /^(-?\d*\.?\d+)(px)?$/i.exec(t);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function attr(svg: string, name: string): string | undefined {
  const re = new RegExp(`<svg\\b[^>]*?\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i");
  const m = re.exec(svg);
  if (!m) return undefined;
  return m[2] !== undefined ? m[2] : m[3];
}

/**
 * Determine the intrinsic pixel viewport of an SVG. Prefer explicit px
 * width/height; fall back to the viewBox extent; finally a square default.
 * Percentage sizes are treated as "unspecified" because they render to 0/150
 * when the SVG is loaded standalone in an <img>.
 */
export function parseSvgViewport(svg: string): { width: number; height: number } {
  const w = parseLength(attr(svg, "width"));
  const h = parseLength(attr(svg, "height"));
  if (w != null && h != null) return { width: w, height: h };

  const vb = attr(svg, "viewBox");
  if (vb) {
    const parts = vb.trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
      return { width: parts[2], height: parts[3] };
    }
  }

  return { width: DEFAULT_SVG_SIZE, height: DEFAULT_SVG_SIZE };
}
