import type { NextConfig } from "next";

const apiBase = process.env.API_BASE_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // same-origin /api proxy: cookies stay on one domain, no CORS needed
    return [{ source: "/api/:path*", destination: `${apiBase}/api/:path*` }];
  },
};

export default nextConfig;
