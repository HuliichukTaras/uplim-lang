# UPLim Toolchain Contracts

This document defines the target public interfaces for the production toolchain.

## Compiler CLI

The stable compiler executable is `uplimc`.

v1 command surface:

- `uplimc check`
- `uplimc build`
- `uplimc run`
- `uplimc test`
- `uplimc fmt`
- `uplimc lsp`
- `uplimc bench`

Command intent:

- `check`: parse, resolve, type-check, borrow-check, validate manifest and capabilities
- `build`: produce target artifact for the selected profile
- `run`: execute with the selected runtime profile, usually through Wasmtime for Wasm targets
- `test`: run unit, integration, and golden tests
- `fmt`: canonical source formatting
- `lsp`: launch the language server
- `bench`: run benchmark suites and emit comparable metrics

## Manifest

The canonical project manifest is `uplim.toml`.

Machine-readable schema:

- `schemas/uplim.manifest.schema.json`

Example shape:

```toml
[package]
name = "hello-service"
version = "0.1.0"
edition = "v1"

[build]
entry = "src/main.upl"
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
ai_remote = false
ai_local = false
ai_tool_call = false
mcp_client = false
clock_wall = true
clock_monotonic = true
env_read = false
process_spawn = false

[ai]
provider = "openai"
model = "gpt-4o-mini"
mode = "structured"
allow_tool_calls = false
allow_mcp = false

[features]
default = ["http"]
```

## Target Profiles

Initial supported profiles:

- `wasm-component`
- `wasm-module-dev`
- `js-interop`

Deferred profiles:

- `native-llvm`

## IR Contracts

The compiler owns these stable internal contract boundaries:

- AST
- HIR
- typed MIR
- borrow-checked MIR
- backend IR

Requirements:

- each layer has explicit span information
- each layer has deterministic serialization for fixtures and tests
- ownership diagnostics are emitted before backend lowering
- backend IR does not accept unresolved types or unresolved capabilities

## File And Module Contract

Source files use the `.upl` extension.

Reserved semantic filenames:

- `main.upl`
- `page.upl`
- `layout.upl`
- `route.upl`
- `server.upl`
- `mod.upl`

Rules:

- `entry` must point to a `.upl` file
- module resolution must follow manifest-defined roots
- dotted imports map deterministically to `.upl` files
- `mod.upl` is the directory module root where used
- `page.upl` and `layout.upl` are app-segment conventions, not generic utility names

## Diagnostics Contract

Diagnostics must support:

- machine-readable code
- severity
- message
- primary span
- optional secondary spans
- fix-it hints where possible

Ownership diagnostics must be first-class, not stringly-typed post-processing.

## Runtime Contract

The v1 runtime contract is defined through WIT packages and WASI capabilities.

Initial host surfaces:

- filesystem
- clocks
- environment
- process
- HTTP
- async task scheduling
- structured logging
- typed errors
- AI model access
- structured generation
- typed tool calls
- MCP client transport

Rules:

- no implicit ambient access
- undeclared capability access is a hard error
- JS interop shims are optional and secondary
- AI responses used for typed program flow must validate against compiler-derived schemas

## AI Standard Library Contract

The language should expose an `std/ai` surface with provider-neutral APIs.

Initial conceptual surface:

- `ai.generate<T>(...) -> Result<T, AiError>`
- `ai.embed(...) -> Result<Vector, AiError>`
- `ai.call_tool<TIn, TOut>(...) -> Result<TOut, AiError>`
- `ai.mcp.connect(...) -> Result<McpSession, AiError>`

Requirements:

- `T` must be schema-derivable for structured generation
- runtime must refuse typed generation when structured mode is unavailable
- provider selection is configuration, not syntax

## Compatibility Layer

The current TypeScript packages remain valid for:

- playground execution
- migration fixtures
- prototype interoperability
- compatibility tests against the Rust core

They are not the long-term semantic owner of the language.
