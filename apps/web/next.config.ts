import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@social-zeka-ai/ui", "@social-zeka-ai/types", "@social-zeka-ai/utils"]
};

export default nextConfig;
