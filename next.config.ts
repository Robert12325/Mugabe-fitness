import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The app's web version lives in public/app (exported from apps/mobile).
  // Its own files are served from there first; any other /app address is
  // one of its screens, so it gets the app's page and the app routes it.
  async rewrites() {
    return [
      { source: "/app", destination: "/app/index.html" },
      { source: "/app/:path*", destination: "/app/index.html" },
    ];
  },
};

export default nextConfig;
