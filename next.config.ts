import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // md-to-pdf usa puppeteer (CJS con exports con __esModule). Si Next lo
  // bundlea, su interop sintético rompe `puppeteer_1.default.launch`. Al
  // marcarlos como externos, Next los `require` en runtime sin tocar, donde
  // funcionan (verificado en Node puro). Fix del bug de generación de PDF.
  serverExternalPackages: ["md-to-pdf", "puppeteer"],
};

export default nextConfig;
