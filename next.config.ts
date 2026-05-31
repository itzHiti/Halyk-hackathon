import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Самодостаточный сервер для Docker (.next/standalone) — минимальный образ.
  output: "standalone",
};

export default nextConfig;
