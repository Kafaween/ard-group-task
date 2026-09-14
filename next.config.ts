import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empty turbopack config to silence warning
  turbopack: {},

  // Hide the dev-mode route indicator badge
  devIndicators: false,
};

export default nextConfig;
