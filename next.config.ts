import type { NextConfig } from "next";

// GitHub Pages build (`npm run build:pages`): the site exported as plain files, served
// from https://murilo-oppizi.github.io/eddm/ — so every link and asset gets the /eddm
// prefix, and images skip Next's on-the-fly resizing (Pages has no server for it).
// The normal build and the local preview are unchanged.
const pages = process.env.PAGES === "1";
const basePath = pages ? "/eddm" : "";

const nextConfig: NextConfig = {
  // Local preview only: lets a phone on the same Wi-Fi open the dev server at the Mac's
  // network address (the "Network:" line `npm run dev` prints). Without it, Next blocks
  // the page's scripts from other devices. Update the address if the Mac's changes.
  allowedDevOrigins: ["192.168.1.181"],
  ...(pages && {
    output: "export",
    // Its own build folder, so it never touches the running local preview's.
    distDir: ".next-pages",
    basePath,
    trailingSlash: true,
    images: { unoptimized: true },
  }),
  // For the few files referenced by hand (logos, key sounds): see src/lib/asset.ts.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
