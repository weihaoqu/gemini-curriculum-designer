import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/curriculum",
  output: "standalone",
  reactCompiler: true,
  serverExternalPackages: ["pdf-parse", "mammoth", "officeparser", "better-sqlite3"],
};

export default nextConfig;
