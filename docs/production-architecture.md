# UPLim Production Architecture

## Purpose

This document defines the target architecture for UPLim as a production language.

The target is not a TypeScript-first transpiler. The target is a Rust-first compiler and runtime architecture for a safe, fast language that ships web and backend workloads first, then expands to broader native targets.

## Primary Goals

- human-readable but formally specified syntax
- strong safety guarantees
- predictable performance
- portable runtime surface
- editor-friendly tooling
- AI-native runtime capabilities without compiler nondeterminism

## Strategic Decisions

- Canonical compiler implementation: Rust
- v1 target domains: CLI, backend services, web via Wasm
- Memory model: ownership and borrows
- Canonical parser: hand-written or tightly controlled Rust parser
- Editor parser: Tree-sitter grammar for IDE features only
- Portable artifact: Wasm components
- Runtime interfaces: WIT plus WASI
- Default runtime host: Wasmtime
- First production codegen backend: Cranelift
- Deferred native optimization backend: LLVM

## System Shape

The production compiler pipeline is:

```text
source
  -> lexer/parser
  -> AST
  -> HIR
  -> typed MIR
  -> borrow-checked MIR
  -> backend IR
  -> target artifact
```

The initial target artifacts are:

- Wasm component for web and backend portability
- optional JS output for playground and interop only

Deferred artifacts:

- LLVM-based native binaries

## Frontend

### Parser

- The canonical compiler parser lives in Rust.
- It owns syntax validation, precise diagnostics, and lowering to AST.
- It is optimized for correctness and semantic control, not editor incrementality.

### Tree-sitter

- Tree-sitter is maintained separately for syntax highlighting, navigation, code folding, and editor recovery from incomplete code.
- The Tree-sitter grammar must not become the compiler source of truth.

## Intermediate Representations

### AST

Responsibility:

- preserve source structure
- attach spans and syntax-level diagnostics
- remain close to user code

### HIR

Responsibility:

- normalize syntactic sugar
- resolve names and modules
- prepare type inference

### Typed MIR

Responsibility:

- represent control flow explicitly
- carry resolved types
- support optimization, borrow checking, and backend lowering

### Borrow-checked MIR

Responsibility:

- encode ownership state
- validate moves, borrows, aliasing, and lifetime constraints
- feed the backend with safety-validated semantics

## Runtime Model

UPLim v1 runtime is a small host ABI, not a framework.

It should expose:

- filesystem
- clocks
- environment variables
- process interfaces
- HTTP primitives
- async task primitives
- structured logging
- typed host errors
- AI model access
- typed tool calling
- MCP client integration

It should not include in v1:

- JVM bridge
- .NET bridge
- broad UI framework semantics
- broad reflection
- platform-specific APIs without capability gates

## Wasm and Host ABI

- Wasm components define the portable binary unit.
- WIT defines the host-facing contract.
- WASI 0.2+ is the stable capability layer.
- Wasmtime is the default runtime host for backend execution and local development.

### Capability Model

Capabilities must be declared explicitly in `uplim.toml`.

Examples:

- `filesystem.read`
- `filesystem.write`
- `network.client`
- `network.server`
- `ai.remote`
- `ai.local`
- `ai.tool_call`
- `mcp.client`
- `clock.wall`
- `clock.monotonic`
- `env.read`
- `process.spawn`

The runtime should refuse undeclared capabilities by default.

## Backend Strategy

### Cranelift first

Why first:

- fast compiler iteration
- strong security posture
- smaller implementation surface
- already production-proven through Wasmtime
- good fit for Wasm-heavy workflows

### LLVM later

Why later:

- higher complexity
- larger maintenance and verification burden
- best used once the language semantics, MIR, and host ABI are already stable

## Compatibility Strategy

- The TypeScript prototype remains a compatibility and experimentation layer.
- New language semantics must be specified against the Rust core, not the TS interpreter.
- JS emission remains acceptable for the website playground and transition tooling.

## AI Boundary

AI is a first-class runtime subsystem of UPLim.

AI is allowed in:

- runtime model access
- typed structured generation
- tool calling
- MCP-based resources and tools
- diagnostics assistance
- refactoring suggestions
- benchmarking analysis
- architecture and evolution recommendations

AI is not allowed to control:

- parsing
- type checking
- borrow checking
- codegen correctness
- semantic acceptance of programs
