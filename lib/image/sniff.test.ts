import { describe, expect, it } from "vitest";
import { sniffFormat } from "./sniff";

/**
 * Helper: build a byte array from a list of numbers, padding to `len` so the
 * sniffer always has enough header to inspect (real files are never 4 bytes).
 */
function bytes(head: number[], len = 64): Uint8Array {
  const b = new Uint8Array(len);
  b.set(head.slice(0, len));
  return b;
}

/** ASCII string → byte array at a given offset inside a padded buffer. */
function withAscii(offset: number, ascii: string, len = 64): Uint8Array {
  const b = new Uint8Array(len);
  for (let i = 0; i < ascii.length; i++) b[offset + i] = ascii.charCodeAt(i);
  return b;
}

describe("sniffFormat", () => {
  it("detects PNG from its 8-byte signature", () => {
    expect(sniffFormat(bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("png");
  });

  it("detects JPEG from FF D8 FF", () => {
    expect(sniffFormat(bytes([0xff, 0xd8, 0xff, 0xe0]))).toBe("jpeg");
  });

  it("detects GIF from GIF87a and GIF89a", () => {
    expect(sniffFormat(withAscii(0, "GIF87a"))).toBe("gif");
    expect(sniffFormat(withAscii(0, "GIF89a"))).toBe("gif");
  });

  it("detects BMP from the BM signature", () => {
    expect(sniffFormat(bytes([0x42, 0x4d]))).toBe("bmp");
  });

  it("detects WebP from RIFF....WEBP", () => {
    const b = withAscii(0, "RIFF");
    b.set([0x00, 0x00, 0x00, 0x00], 4); // size field, irrelevant
    b.set(Array.from("WEBP", (c) => c.charCodeAt(0)), 8);
    expect(sniffFormat(b)).toBe("webp");
  });

  it("does not confuse a WAVE RIFF file with WebP", () => {
    const b = withAscii(0, "RIFF");
    b.set(Array.from("WAVE", (c) => c.charCodeAt(0)), 8);
    expect(sniffFormat(b)).toBe("unknown");
  });

  it("detects TIFF little-endian and big-endian", () => {
    expect(sniffFormat(bytes([0x49, 0x49, 0x2a, 0x00]))).toBe("tiff");
    expect(sniffFormat(bytes([0x4d, 0x4d, 0x00, 0x2a]))).toBe("tiff");
  });

  it("detects PSD from 8BPS", () => {
    expect(sniffFormat(withAscii(0, "8BPS"))).toBe("psd");
  });

  it("detects PDF from %PDF", () => {
    expect(sniffFormat(withAscii(0, "%PDF-1.4"))).toBe("pdf");
  });

  it("detects ICO from 00 00 01 00", () => {
    expect(sniffFormat(bytes([0x00, 0x00, 0x01, 0x00, 0x01, 0x00]))).toBe("ico");
  });

  it("detects AVIF from the ftyp box brand", () => {
    // [size(4)][ftyp][major brand]
    const b = withAscii(4, "ftyp");
    b.set(Array.from("avif", (c) => c.charCodeAt(0)), 8);
    expect(sniffFormat(b)).toBe("avif");
  });

  it("detects HEIC from ftyp heic/heix brands", () => {
    for (const brand of ["heic", "heix", "hevc"]) {
      const b = withAscii(4, "ftyp");
      b.set(Array.from(brand, (c) => c.charCodeAt(0)), 8);
      expect(sniffFormat(b)).toBe("heic");
    }
  });

  it("detects HEIF (mif1/msf1) as heif", () => {
    const b = withAscii(4, "ftyp");
    b.set(Array.from("mif1", (c) => c.charCodeAt(0)), 8);
    expect(sniffFormat(b)).toBe("heif");
  });

  it("detects SVG from a root <svg> tag", () => {
    expect(sniffFormat(withAscii(0, '<svg xmlns="http://www.w3.org/2000/svg">'))).toBe("svg");
  });

  it("detects SVG when it starts with an XML prolog", () => {
    expect(sniffFormat(withAscii(0, '<?xml version="1.0"?>\n<svg>'))).toBe("svg");
  });

  it("detects SVG after a UTF-8 BOM and leading whitespace", () => {
    const b = new Uint8Array(64);
    b.set([0xef, 0xbb, 0xbf], 0); // BOM
    b.set(Array.from("  \n<svg>", (c) => c.charCodeAt(0)), 3);
    expect(sniffFormat(b)).toBe("svg");
  });

  it("detects JPEG XL codestream (FF 0A) and container", () => {
    expect(sniffFormat(bytes([0xff, 0x0a]))).toBe("jxl");
    expect(sniffFormat(bytes([0x00, 0x00, 0x00, 0x0c, 0x4a, 0x58, 0x4c, 0x20, 0x0d, 0x0a, 0x87, 0x0a]))).toBe("jxl");
  });

  it("detects JPEG 2000", () => {
    expect(sniffFormat(bytes([0x00, 0x00, 0x00, 0x0c, 0x6a, 0x50, 0x20, 0x20, 0x0d, 0x0a, 0x87, 0x0a]))).toBe("jp2");
  });

  it("returns unknown for random bytes", () => {
    expect(sniffFormat(bytes([0x01, 0x02, 0x03, 0x04, 0x05]))).toBe("unknown");
  });

  it("returns unknown for an empty buffer", () => {
    expect(sniffFormat(new Uint8Array(0))).toBe("unknown");
  });
});
