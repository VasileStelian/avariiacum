import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  // Același alias ca în tsconfig.json ("@/*" -> "./src/*")
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
