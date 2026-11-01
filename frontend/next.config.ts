import path from "node:path";
import type { NextConfig } from "next";

const apiBase = process.env.API_BASE_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // the home dir holds another lockfile; pin tracing to this app
  outputFileTracingRoot: path.join(import.meta.dirname, ".."),
  // lets a production build run beside a dev server without sharing .next
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  async rewrites() {
    // same-origin /api proxy: cookies stay on one domain, no CORS needed
    return [{ source: "/api/:path*", destination: `${apiBase}/api/:path*` }];
  },
};

export default nextConfig;
