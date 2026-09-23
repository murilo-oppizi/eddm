import { ImageResponse } from "next/og";

import { OPPIZI_SYMBOL_PATHS } from "@/components/site/logo";

// The home-screen icon on iPhones and iPads (they don't use SVG icons): the same pink
// tile with the Oppizi symbol as icon.svg, rendered to a PNG at build time.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#ef2b55" }}>
        <svg width="150" height="150" viewBox="0 0 24 24">
          {OPPIZI_SYMBOL_PATHS.map((d) => (
            <path key={d} d={d} fill="#ffffff" fillRule="evenodd" />
          ))}
        </svg>
      </div>
    ),
    { ...size }
  );
}
