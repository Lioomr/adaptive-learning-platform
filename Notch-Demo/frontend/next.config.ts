import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // The floating dev badge overlaps the sidebar footer in screenshots and demos.
  devIndicators: false,
  partialPrefetching: true,
  turbopack: {
    // The advisor owner area is a sibling of this single Next application.
    root: path.resolve(__dirname, ".."),
    resolveAlias: {
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    },
    rules: {
      "globals.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
