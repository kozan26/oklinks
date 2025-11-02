import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  output: "static",
  integrations: [tailwind({ applyBaseStyles: false })],
  vite: {
    css: {
      devSourcemap: false,
    },
    build: {
      cssCodeSplit: false,
    },
  },
});
