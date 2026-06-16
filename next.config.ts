import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // TypeScript ve derleme hatalarını build sırasında yok say
    ignoreBuildErrors: true,
  },
};

export default nextConfig;