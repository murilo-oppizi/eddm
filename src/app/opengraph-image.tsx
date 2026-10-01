import { ImageResponse } from "next/og";

import { OPPIZI_SYMBOL_PATHS } from "@/components/site/logo";
import { hero, site } from "@/content/site";

// The preview card shown when a link to the site is shared (Slack, LinkedIn, iMessage…):
// the logo, the hero headline and its three checks. Rendered to a PNG at build time.
export const alt = `${site.name}, powered by Oppizi: ${hero.title}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// Rendered once at build time (also what lets the static GitHub Pages export include it).
export const dynamic = "force-static";

const PINK = "#ef2b55";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#ffffff",
          borderBottom: `16px solid ${PINK}`,
          color: "#020618",
        }}
      >
        {/* Logo: symbol · EDDM | powered by Oppizi */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="92" height="47" viewBox="2.6 7.1 18.8 9.6">
            {OPPIZI_SYMBOL_PATHS.map((d) => (
              <path key={d} d={d} fill={PINK} fillRule="evenodd" />
            ))}
          </svg>
          <div style={{ display: "flex", fontSize: 56, fontWeight: 700, letterSpacing: -1 }}>{site.name}</div>
          <div style={{ display: "flex", width: 2, height: 44, background: "#e2e8f0" }} />
          <div style={{ display: "flex", fontSize: 30, color: PINK }}>powered by Oppizi</div>
        </div>

        <div style={{ display: "flex", fontSize: 76, fontWeight: 700, lineHeight: 1.08, letterSpacing: -2, maxWidth: 1000 }}>
          {hero.title}
        </div>

        <div style={{ display: "flex", gap: 40, fontSize: 30, color: "#45556c" }}>
          {hero.checks.map((check) => (
            <div key={check} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex", width: 14, height: 14, borderRadius: 7, background: PINK }} />
              {check}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
