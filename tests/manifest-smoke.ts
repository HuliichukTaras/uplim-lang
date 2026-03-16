import assert from 'node:assert/strict'

import {
  formatManifestDiagnostics,
  parseManifestString,
} from 'uplim-engine'

const validManifest = `
[package]
name = "uplim-demo"
version = "0.1.0"
edition = "v1"

[build]
entry = "app/main.upl"
profile = "wasm-component"
output = "dist/"
app_root = "app"
module_roots = ["modules", "components", "types"]
test_roots = ["tests"]

[capabilities]
filesystem_read = false
filesystem_write = false
network_client = true
network_server = true
clock_wall = true
clock_monotonic = true
env_read = false
process_spawn = false
ai_remote = true
ai_local = false
ai_embedding = false
ai_tool_call = true
mcp_client = true

[ai]
provider = "openai"
model = "gpt-4o-mini"
mode = "structured"
allow_tool_calls = true
allow_mcp = true
temperature = 0.2
endpoint = "https://api.openai.com/v1/responses"

[features]
default = ["http", "ai"]
`

const validResult = parseManifestString(validManifest, 'valid.uplim.toml')
assert.equal(validResult.diagnostics.length, 0, formatManifestDiagnostics(validResult.diagnostics).join('\n'))
assert.ok(validResult.manifest, 'expected valid manifest')
assert.equal(validResult.manifest.build.entry, 'app/main.upl')
assert.equal(validResult.manifest.ai?.provider, 'openai')

const invalidManifest = `
[package]
name = "UPLim"
version = "0.1"
edition = "v2"

[build]
entry = "app/main.ts"
profile = "unknown"
output = ""

[capabilities]
network_client = false
ai_remote = true
ai_tool_call = true
mcp_client = true

[ai]
provider = "openai"
model = ""
mode = "structured"
allow_tool_calls = false
allow_mcp = false
`

const invalidResult = parseManifestString(invalidManifest, 'invalid.uplim.toml')
assert.equal(invalidResult.manifest, null)
const diagnosticCodes = new Set(invalidResult.diagnostics.map(diagnostic => diagnostic.code))
assert.ok(diagnosticCodes.has('MANIFEST_INVALID_PACKAGE_NAME'))
assert.ok(diagnosticCodes.has('MANIFEST_INVALID_PACKAGE_VERSION'))
assert.ok(diagnosticCodes.has('MANIFEST_INVALID_EDITION'))
assert.ok(diagnosticCodes.has('MANIFEST_INVALID_ENTRY'))
assert.ok(diagnosticCodes.has('MANIFEST_INVALID_PROFILE'))
assert.ok(diagnosticCodes.has('MANIFEST_NETWORK_CLIENT_REQUIRED'))
assert.ok(diagnosticCodes.has('MANIFEST_AI_TOOL_CALL_REQUIRED'))
assert.ok(diagnosticCodes.has('MANIFEST_MCP_REQUIRED'))

console.log('Manifest smoke OK')
