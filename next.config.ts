import type { NextConfig } from "next";
import path from "node:path";
import pkg from "./package.json";

// Configuracion de Next.js. React en modo estricto para detectar efectos mal escritos.
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Expone la version del paquete al cliente.
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
  },
  // Fija la raiz del workspace para evitar avisos por lockfiles externos.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
