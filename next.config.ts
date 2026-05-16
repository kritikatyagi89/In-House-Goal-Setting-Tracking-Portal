import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.31.226"],
  serverExternalPackages: ["@libsql/client", "@prisma/adapter-libsql", "better-sqlite3"],
};

export default nextConfig;