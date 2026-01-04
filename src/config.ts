
export interface UPLimConfig {
  target?: "node" | "edge" | "wasm"
  ai?: {
    enabled: boolean
    provider: string
  }
  build?: {
    outDir: string
    wasm: boolean
  }
  modules?: string[]
}

export function defineConfig(config: UPLimConfig): UPLimConfig {
  return config
}
