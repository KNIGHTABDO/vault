import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  outputFileTracingRoot: path.resolve(process.cwd()),
  outputFileTracingIncludes: {
    "/*": ["./scripts/extract-pdf.mjs"],
  },
};

export default nextConfig;
