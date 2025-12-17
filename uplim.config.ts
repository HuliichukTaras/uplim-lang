
import { defineConfig } from "./src/config"

export default defineConfig({
  target: "node", // node | edge | wasm
  ai: {
    enabled: true,
    provider: "openai",
  },
  build: {
    outDir: "build",
    wasm: true,
  },
  modules: [],
})
