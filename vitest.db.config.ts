import { defineConfig } from "vitest/config";

import unit from "./vitest.config";

// Rulează pe Supabase local: `npx supabase start`, apoi `npm run test:db`.
export default defineConfig({
  ...unit,
  test: {
    include: ["test/db/**/*.test.ts"],
    fileParallelism: false,
  },
});
