import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma and the Anthropic SDK should only run server-side.
  serverExternalPackages: ["@prisma/client", "@anthropic-ai/sdk"],
  experimental: {
    // Evidence files are sent (base64) through the submit server action and
    // stored as bytes in the DB, so allow a larger request body.
    serverActions: { bodySizeLimit: "15mb" },
  },
};

export default nextConfig;
