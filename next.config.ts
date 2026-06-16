import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // TypeScript hataları olsa bile projeyi build etmeye devam et
    ignoreBuildErrors: true,
  },
  eslint: {
    // ESLint hataları olsa bile projeyi build etmeye devam et
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;