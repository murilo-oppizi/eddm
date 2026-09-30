import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Local preview only: lets a phone on the same Wi-Fi open the dev server at the Mac's
  // network address (the "Network:" line `npm run dev` prints). Without it, Next blocks
  // the page's scripts from other devices. Update the address if the Mac's changes.
  allowedDevOrigins: ["192.168.1.128"],
};

export default nextConfig;
