import { defineConfig } from "vitest/config";

// Rulează după `npm run build`: test/smoke.test.ts pornește `next start` și citește HTML-ul real.
export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
  },
});
