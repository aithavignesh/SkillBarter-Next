import type { NextConfig } from "next";

// Keep browser API requests same-origin so HttpOnly/SameSite=strict auth cookies
// work when the API is hosted separately (for example, on Render).
const backendApiOrigin = (process.env.BACKEND_API_URL || "http://localhost:4000").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendApiOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
