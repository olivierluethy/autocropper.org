import { describe, expect, it } from "vitest";
import { resolveFormat } from "./decode";

/**
 * Magic bytes are authoritative; MIME/extension are only hints used to recover
 * a guess when the signature is unrecognised (e.g. an uncommon but decodable
 * container). This mirrors real uploads where the extension lies.
 */
describe("resolveFormat", () => {
  it("trusts the sniffed format over a contradicting MIME and extension", () => {
    expect(resolveFormat("jpeg", "image/png", "logo.png")).toBe("jpeg");
  });

  it("uses the extension when the signature is unrecognised", () => {
    expect(resolveFormat("unknown", "", "logo.png")).toBe("png");
    expect(resolveFormat("unknown", "", "photo.HEIC")).toBe("heic");
    expect(resolveFormat("unknown", "", "scan.tiff")).toBe("tiff");
  });

  it("uses the MIME type when there is no useful extension", () => {
    expect(resolveFormat("unknown", "image/svg+xml", "clipboard")).toBe("svg");
    expect(resolveFormat("unknown", "image/webp", "blob")).toBe("webp");
  });

  it("stays unknown when nothing identifies the file", () => {
    expect(resolveFormat("unknown", "application/octet-stream", "data.bin")).toBe("unknown");
  });
});
