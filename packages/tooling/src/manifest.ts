import * as fs from 'fs'
import * as path from 'path'

export type UplimProfile = 'wasm-component' | 'wasm-module-dev' | 'js-interop' | 'native-llvm'
export type UplimEdition = 'v1'
export type UplimAIProvider = 'openai' | 'anthropic' | 'ollama' | 'custom'
export type UplimAIMode = 'structured' | 'text' | 'tooling'

export interface ManifestLocation {
  file: string
  line: number
  column: number
}

export interface ManifestDiagnostic {
  code: string
  message: string
  severity: 'warning' | 'error'
  location: ManifestLocation
}

export interface UplimPackageConfig {
  name: string
  version: string
  edition: UplimEdition
  description?: string
}

export interface UplimBuildConfig {
  entry: string
  profile: UplimProfile
  output: string
  app_root?: string
  module_roots?: string[]
  test_roots?: string[]
}

export interface UplimCapabilitiesConfig {
  filesystem_read?: boolean
  filesystem_write?: boolean
  network_client?: boolean
  network_server?: boolean
  clock_wall?: boolean
  clock_monotonic?: boolean
  env_read?: boolean
  process_spawn?: boolean
  ai_remote?: boolean
  ai_local?: boolean
  ai_embedding?: boolean
  ai_tool_call?: boolean
  mcp_client?: boolean
}

export interface UplimAIConfig {
  provider: UplimAIProvider
  model: string
  mode: UplimAIMode
  allow_tool_calls?: boolean
  allow_mcp?: boolean
  temperature?: number
  endpoint?: string
}

export interface UplimFeaturesConfig {
  default?: string[]
}

export interface UplimManifest {
  package: UplimPackageConfig
  build: UplimBuildConfig
  capabilities: UplimCapabilitiesConfig
  ai?: UplimAIConfig
  features?: UplimFeaturesConfig
}

export interface ManifestParseResult {
  manifest: UplimManifest | null
  diagnostics: ManifestDiagnostic[]
}

type ParsedScalar = string | boolean | number | string[]
type ParsedTable = Record<string, ParsedScalar>
type ParsedDocument = Record<string, ParsedTable>

const BOOLEAN_KEYS = new Set([
  'filesystem_read',
  'filesystem_write',
  'network_client',
  'network_server',
  'clock_wall',
  'clock_monotonic',
  'env_read',
  'process_spawn',
  'ai_remote',
  'ai_local',
  'ai_embedding',
  'ai_tool_call',
  'mcp_client',
  'allow_tool_calls',
  'allow_mcp',
])

const STRING_ARRAY_KEYS = new Set(['module_roots', 'test_roots', 'default'])
const SUPPORTED_PROFILES = new Set<UplimProfile>(['wasm-component', 'wasm-module-dev', 'js-interop', 'native-llvm'])
const SUPPORTED_AI_PROVIDERS = new Set<UplimAIProvider>(['openai', 'anthropic', 'ollama', 'custom'])
const SUPPORTED_AI_MODES = new Set<UplimAIMode>(['structured', 'text', 'tooling'])

function makeDiagnostic(
  file: string,
  line: number,
  column: number,
  code: string,
  message: string,
  severity: 'warning' | 'error' = 'error',
): ManifestDiagnostic {
  return {
    code,
    message,
    severity,
    location: { file, line, column },
  }
}

function stripComment(line: string): string {
  let inString = false
  let escaped = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (escaped) {
      escaped = false
      continue
    }

    if (char === '\\') {
      escaped = true
      continue
    }

    if (char === '"') {
      inString = !inString
      continue
    }

    if (char === '#' && !inString) {
      return line.slice(0, i)
    }
  }

  return line
}

function parseStringArray(raw: string): string[] | null {
  const inner = raw.slice(1, -1).trim()
  if (!inner) {
    return []
  }

  const values: string[] = []
  let current = ''
  let inString = false
  let escaped = false

  for (let i = 0; i < inner.length; i++) {
    const char = inner[i]

    if (escaped) {
      current += char
      escaped = false
      continue
    }

    if (char === '\\') {
      current += char
      escaped = true
      continue
    }

    if (char === '"') {
      inString = !inString
      current += char
      continue
    }

    if (char === ',' && !inString) {
      values.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  if (current.trim()) {
    values.push(current.trim())
  }

  const parsed: string[] = []
  for (const value of values) {
    if (!value.startsWith('"') || !value.endsWith('"')) {
      return null
    }
    parsed.push(JSON.parse(value) as string)
  }

  return parsed
}

function parseValue(raw: string): ParsedScalar | null {
  const value = raw.trim()

  if (value.startsWith('"') && value.endsWith('"')) {
    return JSON.parse(value) as string
  }

  if (value === 'true') return true
  if (value === 'false') return false

  if (value.startsWith('[') && value.endsWith(']')) {
    return parseStringArray(value)
  }

  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return Number(value)
  }

  return null
}

function buildManifest(parsed: ParsedDocument): UplimManifest | null {
  if (!parsed.package || !parsed.build || !parsed.capabilities) {
    return null
  }

  return {
    package: parsed.package as unknown as UplimPackageConfig,
    build: parsed.build as unknown as UplimBuildConfig,
    capabilities: parsed.capabilities as unknown as UplimCapabilitiesConfig,
    ai: parsed.ai as unknown as UplimAIConfig | undefined,
    features: parsed.features as unknown as UplimFeaturesConfig | undefined,
  }
}

export function parseManifestString(content: string, filePath = 'uplim.toml'): ManifestParseResult {
  const diagnostics: ManifestDiagnostic[] = []
  const parsed: ParsedDocument = {}
  let currentSection: string | null = null

  const lines = content.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1
    const stripped = stripComment(lines[i]).trim()

    if (!stripped) {
      continue
    }

    const sectionMatch = stripped.match(/^\[([A-Za-z0-9_.-]+)\]$/)
    if (sectionMatch) {
      currentSection = sectionMatch[1]
      parsed[currentSection] ??= {}
      continue
    }

    if (!currentSection) {
      diagnostics.push(makeDiagnostic(filePath, lineNumber, 1, 'MANIFEST_SECTION_REQUIRED', 'Key-value pairs must appear inside a named table section.'))
      continue
    }

    const eqIndex = stripped.indexOf('=')
    if (eqIndex === -1) {
      diagnostics.push(makeDiagnostic(filePath, lineNumber, 1, 'MANIFEST_INVALID_ASSIGNMENT', 'Expected a key = value assignment.'))
      continue
    }

    const key = stripped.slice(0, eqIndex).trim()
    const rawValue = stripped.slice(eqIndex + 1).trim()

    if (!key) {
      diagnostics.push(makeDiagnostic(filePath, lineNumber, 1, 'MANIFEST_EMPTY_KEY', 'Manifest keys must not be empty.'))
      continue
    }

    const parsedValue = parseValue(rawValue)
    if (parsedValue === null) {
      diagnostics.push(makeDiagnostic(filePath, lineNumber, eqIndex + 2, 'MANIFEST_INVALID_VALUE', `Unsupported TOML value for key "${key}".`))
      continue
    }

    parsed[currentSection] ??= {}
    parsed[currentSection][key] = parsedValue
  }

  const manifest = buildManifest(parsed)
  if (!manifest) {
    if (!parsed.package) {
      diagnostics.push(makeDiagnostic(filePath, 1, 1, 'MANIFEST_MISSING_PACKAGE', 'Missing required [package] section.'))
    }
    if (!parsed.build) {
      diagnostics.push(makeDiagnostic(filePath, 1, 1, 'MANIFEST_MISSING_BUILD', 'Missing required [build] section.'))
    }
    if (!parsed.capabilities) {
      diagnostics.push(makeDiagnostic(filePath, 1, 1, 'MANIFEST_MISSING_CAPABILITIES', 'Missing required [capabilities] section.'))
    }
    return { manifest: null, diagnostics }
  }

  diagnostics.push(...validateManifest(manifest, filePath))
  return {
    manifest: diagnostics.some(diag => diag.severity === 'error') ? null : manifest,
    diagnostics,
  }
}

export function loadManifestFile(fileOrDirectory: string): ManifestParseResult {
  const resolved = path.resolve(fileOrDirectory)
  const manifestPath = fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()
    ? path.join(resolved, 'uplim.toml')
    : resolved

  if (!fs.existsSync(manifestPath)) {
    return {
      manifest: null,
      diagnostics: [makeDiagnostic(manifestPath, 1, 1, 'MANIFEST_FILE_NOT_FOUND', `Manifest file not found: ${manifestPath}`)],
    }
  }

  const content = fs.readFileSync(manifestPath, 'utf-8')
  return parseManifestString(content, manifestPath)
}

export function validateManifest(manifest: UplimManifest, filePath = 'uplim.toml'): ManifestDiagnostic[] {
  const diagnostics: ManifestDiagnostic[] = []

  const pushError = (code: string, message: string) => diagnostics.push(makeDiagnostic(filePath, 1, 1, code, message))

  if (!/^[a-z][a-z0-9_-]*$/.test(manifest.package.name)) {
    pushError('MANIFEST_INVALID_PACKAGE_NAME', 'package.name must match ^[a-z][a-z0-9_-]*$.')
  }

  if (!/^[0-9]+\.[0-9]+\.[0-9]+(-[A-Za-z0-9.-]+)?$/.test(manifest.package.version)) {
    pushError('MANIFEST_INVALID_PACKAGE_VERSION', 'package.version must be a semver-like string such as 0.1.0.')
  }

  if (manifest.package.edition !== 'v1') {
    pushError('MANIFEST_INVALID_EDITION', 'package.edition must be "v1".')
  }

  if (!manifest.build.entry.endsWith('.upl')) {
    pushError('MANIFEST_INVALID_ENTRY', 'build.entry must point to a .upl source file.')
  }

  if (!SUPPORTED_PROFILES.has(manifest.build.profile)) {
    pushError('MANIFEST_INVALID_PROFILE', `build.profile must be one of: ${Array.from(SUPPORTED_PROFILES).join(', ')}.`)
  }

  if (!manifest.build.output.trim()) {
    pushError('MANIFEST_INVALID_OUTPUT', 'build.output must not be empty.')
  }

  for (const key of Object.keys(manifest.capabilities) as Array<keyof UplimCapabilitiesConfig>) {
    const value = manifest.capabilities[key]
    if (typeof value !== 'boolean' && value !== undefined) {
      pushError('MANIFEST_INVALID_CAPABILITY_VALUE', `capabilities.${key} must be a boolean.`)
    }
  }

  for (const key of ['module_roots', 'test_roots'] as const) {
    const value = manifest.build[key]
    if (value && (!Array.isArray(value) || value.some(item => typeof item !== 'string'))) {
      pushError('MANIFEST_INVALID_ROOT_LIST', `build.${key} must be an array of strings.`)
    }
  }

  if (manifest.features?.default && (!Array.isArray(manifest.features.default) || manifest.features.default.some(item => typeof item !== 'string'))) {
    pushError('MANIFEST_INVALID_FEATURES_DEFAULT', 'features.default must be an array of strings.')
  }

  if (manifest.capabilities.ai_remote) {
    if (!manifest.ai) {
      pushError('MANIFEST_AI_CONFIG_REQUIRED', '[ai] section is required when capabilities.ai_remote is true.')
    }
    if (!manifest.capabilities.network_client) {
      pushError('MANIFEST_NETWORK_CLIENT_REQUIRED', 'capabilities.network_client must be true when capabilities.ai_remote is true.')
    }
  }

  if (manifest.capabilities.ai_tool_call && !manifest.ai?.allow_tool_calls) {
    pushError('MANIFEST_AI_TOOL_CALL_REQUIRED', 'ai.allow_tool_calls must be true when capabilities.ai_tool_call is true.')
  }

  if (manifest.capabilities.mcp_client && !manifest.ai?.allow_mcp) {
    pushError('MANIFEST_MCP_REQUIRED', 'ai.allow_mcp must be true when capabilities.mcp_client is true.')
  }

  if (manifest.ai) {
    if (!SUPPORTED_AI_PROVIDERS.has(manifest.ai.provider)) {
      pushError('MANIFEST_INVALID_AI_PROVIDER', `ai.provider must be one of: ${Array.from(SUPPORTED_AI_PROVIDERS).join(', ')}.`)
    }

    if (!SUPPORTED_AI_MODES.has(manifest.ai.mode)) {
      pushError('MANIFEST_INVALID_AI_MODE', `ai.mode must be one of: ${Array.from(SUPPORTED_AI_MODES).join(', ')}.`)
    }

    if (!manifest.ai.model.trim()) {
      pushError('MANIFEST_INVALID_AI_MODEL', 'ai.model must not be empty.')
    }

    if (manifest.ai.temperature !== undefined && (manifest.ai.temperature < 0 || manifest.ai.temperature > 2)) {
      pushError('MANIFEST_INVALID_AI_TEMPERATURE', 'ai.temperature must be between 0 and 2.')
    }

    if (manifest.ai.endpoint !== undefined) {
      try {
        new URL(manifest.ai.endpoint)
      } catch {
        pushError('MANIFEST_INVALID_AI_ENDPOINT', 'ai.endpoint must be a valid absolute URL.')
      }
    }
  }

  return diagnostics
}

export function formatManifestDiagnostics(diagnostics: ManifestDiagnostic[]): string[] {
  return diagnostics.map(diagnostic => {
    const prefix = diagnostic.severity === 'error' ? '✗' : '⚠'
    return `${prefix} ${diagnostic.location.file}:${diagnostic.location.line}:${diagnostic.location.column} ${diagnostic.code} - ${diagnostic.message}`
  })
}
