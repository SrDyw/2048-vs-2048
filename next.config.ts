import type { NextConfig } from "next";
import path from "node:path";

// Configuracion de Next.js. React en modo estricto para detectar efectos mal escritos.
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Fija la raiz del workspace para evitar avisos por lockfiles externos.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
