import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
  // Client-side Router Cache: a page already visited in the last 5 minutes opens instantly
  // from cache instead of re-fetching, on both back/forward nav and re-clicking a sidebar link.
  experimental: {
    staleTimes: {
      dynamic: 300,
      static: 300,
    },
  },
};

export default nextConfig;
