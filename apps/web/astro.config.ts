import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://devlytics.gabrueldev.com",
  trailingSlash: "ignore",
  i18n: {
    locales: ["pt", "en"],
    defaultLocale: "pt",
    routing: { prefixDefaultLocale: false },
  },
  build: { format: "directory" },
});
