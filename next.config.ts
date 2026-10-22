import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/**": ["./db/**/*.sql"],
  },
};

export default nextConfig;
