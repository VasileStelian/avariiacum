import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const local = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      // Același alias ca în tsconfig.json ("@/*" -> "./src/*")
      "@": local("./src"),
      // Testele rulează doar pe server: varianta „react-server” a pachetului, cea goală
      "server-only": local("./node_modules/server-only/empty.js"),
    },
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
