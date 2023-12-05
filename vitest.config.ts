import { defineConfig, mergeConfig } from "vitest/config"

import viteConfig from "./vite.config"

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      coverage: {
        reporter: ["json-summary", "json", "text"],
      },
      outputFile: "./test-result/junit.xml",
      reporters: ["verbose", "junit"],
    },
  }),
)
