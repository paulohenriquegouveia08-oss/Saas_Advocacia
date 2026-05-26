import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/proxy/supabase/:path*",
        destination: "http://137.131.233.254:8010/:path*",
      },
      {
        source: "/proxy/backend/:path*",
        destination: "http://137.131.233.254:3334/:path*",
      },
    ];
  },
};

export default nextConfig;
