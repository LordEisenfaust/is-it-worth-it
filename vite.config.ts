import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// base "./" keeps all asset URLs relative, so the build runs from any sub-path or file host.
export default defineConfig({
  base: "./",
  plugins: [react()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
