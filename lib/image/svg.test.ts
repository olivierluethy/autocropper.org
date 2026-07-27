import { describe, expect, it } from "vitest";
import { parseSvgViewport, sanitizeSvg } from "./svg";

/**
 * `sanitizeSvg` is defense-in-depth. The real security boundary is that we
 * rasterize SVG through an `<img>` element (secure static mode: no scripts,
 * external subresources blocked, canvas untainted). These tests pin the extra
 * belt-and-suspenders removals so a policy regression is caught.
 */
describe("sanitizeSvg", () => {
  it("removes <script> elements and their contents", () => {
    const out = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><rect/></svg>',
    );
    expect(out).not.toMatch(/<script/i);
    expect(out).not.toMatch(/alert/);
    expect(out).toMatch(/<rect/);
  });

  it("removes inline event-handler attributes", () => {
    const out = sanitizeSvg('<svg onload="steal()"><rect onclick="x()"/></svg>');
    expect(out).not.toMatch(/onload/i);
    expect(out).not.toMatch(/onclick/i);
  });

  it("removes <foreignObject> blocks", () => {
    const out = sanitizeSvg(
      "<svg><foreignObject><body>html</body></foreignObject><circle/></svg>",
    );
    expect(out).not.toMatch(/foreignObject/i);
    expect(out).toMatch(/<circle/);
  });

  it("neutralizes external http(s) references in href / xlink:href", () => {
    const out = sanitizeSvg(
      '<svg><image href="https://evil.example/x.png"/><use xlink:href="http://a/b#c"/></svg>',
    );
    expect(out).not.toMatch(/evil\.example/);
    expect(out).not.toMatch(/http:\/\/a/);
  });

  it("neutralizes protocol-relative and external url() references", () => {
    const out = sanitizeSvg(
      '<svg><rect fill="url(//cdn.example/p.svg#g)"/><rect style="fill:url(https://x/y)"/></svg>',
    );
    expect(out).not.toMatch(/cdn\.example/);
    expect(out).not.toMatch(/https:\/\/x/);
  });

  it("keeps internal fragment references (url(#gradient))", () => {
    const out = sanitizeSvg('<svg><rect fill="url(#grad)"/></svg>');
    expect(out).toMatch(/url\(#grad\)/);
  });

  it("leaves a clean SVG structurally intact", () => {
    const clean = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M0 0h10v10H0z"/></svg>';
    const out = sanitizeSvg(clean);
    expect(out).toMatch(/<svg/);
    expect(out).toMatch(/<path/);
    expect(out).toMatch(/viewBox="0 0 10 10"/);
  });
});

describe("parseSvgViewport", () => {
  it("reads explicit width and height in px", () => {
    expect(parseSvgViewport('<svg width="200" height="120"></svg>')).toEqual({
      width: 200,
      height: 120,
    });
  });

  it("strips a px unit suffix", () => {
    expect(parseSvgViewport('<svg width="64px" height="64px"></svg>')).toEqual({
      width: 64,
      height: 64,
    });
  });

  it("falls back to viewBox dimensions when width/height are missing", () => {
    expect(parseSvgViewport('<svg viewBox="0 0 512 256"></svg>')).toEqual({
      width: 512,
      height: 256,
    });
  });

  it("ignores percentage sizes and uses the viewBox instead", () => {
    expect(
      parseSvgViewport('<svg width="100%" height="100%" viewBox="0 0 48 48"></svg>'),
    ).toEqual({ width: 48, height: 48 });
  });

  it("returns a sane default when nothing is declared", () => {
    expect(parseSvgViewport("<svg></svg>")).toEqual({ width: 512, height: 512 });
  });
});
