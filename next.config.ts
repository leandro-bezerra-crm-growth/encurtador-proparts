import type { NextConfig } from "next";

// Painel interno 100% dinâmico: sem Cache Components
const nextConfig: NextConfig = {
  poweredByHeader: false,
};

export default nextConfig;
