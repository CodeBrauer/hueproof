import type { NextConfig } from "next";
import { BASE_PATH } from "./src/lib/site";

const nextConfig: NextConfig = {
  // Taken from the path of NEXT_PUBLIC_SITE_URL, so the site can live in a sub-folder of its host.
  basePath: BASE_PATH,
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
