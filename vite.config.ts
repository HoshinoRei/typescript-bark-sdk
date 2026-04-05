import { resolve } from "path"
import dts from "unplugin-dts/vite"
import { defineConfig } from "vite"

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      fileName: "index",
      formats: ["es", "umd"],
      name: "BarkSDK",
    },
    sourcemap: true,
  },
  plugins: [
    dts({
      bundleTypes: true,
    }),
  ],
})
