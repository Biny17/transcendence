import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: true,
  },
  allowedDevOrigins: [
    process.env.FRONT_HOST,
    "localhost",
    "127.0.0.1",
  ].filter(Boolean) as string[],
};

export default nextConfig;
