import { ImageResponse } from "next/og";

export const alt = "Autocropper — Turn any logo into a perfect icon set";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Site-wide social card. Uses the dark palette from `globals.css` so shared
 * links look like the site. Re-exported by `twitter-image.tsx`.
 */
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#050507",
          padding: 80,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 30,
            color: "#a3a3a3",
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 6,
              background: "#818cf8",
            }}
          />
          autocropper.org
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 76,
              lineHeight: 1.1,
              color: "#fafafa",
              letterSpacing: -2,
            }}
          >
            Turn any logo into a perfect icon set.
          </div>
          <div style={{ fontSize: 34, color: "#a3a3a3" }}>
            Every size from 16 to 512 — in your browser, never uploaded.
          </div>
        </div>
        <div style={{ display: "flex", height: 8, borderRadius: 4, background: "#818cf8", width: 220 }} />
      </div>
    ),
    size,
  );
}
