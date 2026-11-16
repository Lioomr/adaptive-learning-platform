import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // The floating dev badge overlaps the sidebar footer in screenshots and demos.
  devIndicators: false,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
