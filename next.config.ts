import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Plain HTML, CSS and JS in `out/`, so the site can be hosted on GitHub Pages or any static host.
  output: "export",
  // Every page becomes `<path>/index.html`, so `/de/` resolves on any static host.
  trailingSlash: true,
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
