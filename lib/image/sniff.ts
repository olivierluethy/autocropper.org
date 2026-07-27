/**
 * Magic-byte format detection.
 *
 * We sniff the real format from the file signature rather than trusting the
 * extension or the browser-reported MIME type: a large share of real-world
 * uploads are mislabelled (a `logo.png` that is actually a JPEG, a Slack export
 * with no extension, an iPhone `.jpg` that is really HEIC). The extension/MIME
 * is only ever a tiebreaker upstream — never the source of truth.
 *
 * Pure function: takes the first bytes of the file, returns a format tag.
 */

export type ImageFormat =
  | "png"
  | "jpeg"
  | "gif"
  | "bmp"
  | "webp"
  | "avif"
  | "heic"
  | "heif"
  | "tiff"
  | "psd"
  | "pdf"
  | "ico"
  | "svg"
  | "jxl"
  | "jp2"
  | "unknown";

/** Bytes `[off, off+ascii.length)` equal the ASCII string. */
function matchAscii(b: Uint8Array, off: number, ascii: string): boolean {
  if (off + ascii.length > b.length) return false;
  for (let i = 0; i < ascii.length; i++) {
    if (b[off + i] !== ascii.charCodeAt(i)) return false;
  }
  return true;
}

/** Bytes `[0, sig.length)` equal the given byte sequence. */
function matchBytes(b: Uint8Array, sig: number[]): boolean {
  if (b.length < sig.length) return false;
  for (let i = 0; i < sig.length; i++) {
    if (b[i] !== sig[i]) return false;
  }
  return true;
}

/**
 * ISO-BMFF (MP4-family) container brands. HEIC, AVIF and HEIF all share the
 * `....ftyp<brand>` header and differ only by the major/compatible brand, so
 * they must be disambiguated by that brand string rather than the box itself.
 */
const FTYP_BRANDS: Record<string, ImageFormat> = {
  avif: "avif",
  avis: "avif",
  heic: "heic",
  heix: "heic",
  hevc: "heic",
  hevx: "heic",
  mif1: "heif",
  msf1: "heif",
  heim: "heif",
  heis: "heif",
};

/** True when a `<svg` root tag appears at the very start (past BOM/space/XML prolog). */
function looksLikeSvg(b: Uint8Array): boolean {
  // Only scan a small prefix; SVG is text and the root tag is near the top.
  const limit = Math.min(b.length, 1024);
  let i = 0;
  // Skip a UTF-8 BOM.
  if (b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) i = 3;
  // Decode the prefix as latin1-ish text (tags are ASCII) and search.
  let text = "";
  for (let j = i; j < limit; j++) text += String.fromCharCode(b[j]);
  const lower = text.toLowerCase();
  // Accept either a direct root <svg or an XML prolog followed by <svg.
  if (/^\s*<svg[\s>]/.test(lower)) return true;
  if (/^\s*<\?xml[\s\S]*?<svg[\s>]/.test(lower)) return true;
  return false;
}

export function sniffFormat(b: Uint8Array): ImageFormat {
  if (b.length < 2) return "unknown";

  // PNG — 8-byte signature.
  if (matchBytes(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";

  // JPEG — SOI marker.
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";

  // GIF.
  if (matchAscii(b, 0, "GIF87a") || matchAscii(b, 0, "GIF89a")) return "gif";

  // BMP.
  if (b[0] === 0x42 && b[1] === 0x4d) return "bmp";

  // JPEG XL — codestream (FF 0A) or ISO-BMFF container box.
  if (b[0] === 0xff && b[1] === 0x0a) return "jxl";
  if (matchBytes(b, [0x00, 0x00, 0x00, 0x0c, 0x4a, 0x58, 0x4c, 0x20, 0x0d, 0x0a, 0x87, 0x0a])) {
    return "jxl";
  }

  // JPEG 2000.
  if (matchBytes(b, [0x00, 0x00, 0x00, 0x0c, 0x6a, 0x50, 0x20, 0x20, 0x0d, 0x0a, 0x87, 0x0a])) {
    return "jp2";
  }

  // RIFF container → only WEBP is an image; WAVE/AVI must fall through.
  if (matchAscii(b, 0, "RIFF") && matchAscii(b, 8, "WEBP")) return "webp";

  // ISO-BMFF `ftyp` box → HEIC/HEIF/AVIF, disambiguated by brand.
  if (matchAscii(b, 4, "ftyp") && b.length >= 12) {
    const brand = String.fromCharCode(b[8], b[9], b[10], b[11]).toLowerCase();
    const hit = FTYP_BRANDS[brand];
    if (hit) return hit;
  }

  // TIFF — little- or big-endian.
  if (matchBytes(b, [0x49, 0x49, 0x2a, 0x00]) || matchBytes(b, [0x4d, 0x4d, 0x00, 0x2a])) {
    return "tiff";
  }

  // PSD.
  if (matchAscii(b, 0, "8BPS")) return "psd";

  // PDF.
  if (matchAscii(b, 0, "%PDF")) return "pdf";

  // ICO — reserved(0) + type(1=icon).
  if (matchBytes(b, [0x00, 0x00, 0x01, 0x00])) return "ico";

  // SVG — text-based, checked last so binary signatures win first.
  if (looksLikeSvg(b)) return "svg";

  return "unknown";
}
