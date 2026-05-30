import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma and the Anthropic SDK should only run server-side.
  serverExternalPackages: ["@prisma/client", "@anthropic-ai/sdk"],
};

export default nextConfig;
