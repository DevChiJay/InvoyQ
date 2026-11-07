import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    // Serve AVIF/WebP to browsers that support them (screenshots on /how-to-use are large PNGs).
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
