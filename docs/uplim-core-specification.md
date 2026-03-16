# UPLim Core Specification
Version: 2.0-draft

## 1. Purpose

UPLim is a general-purpose compiled language project targeting:

- readable source code
- strong safety guarantees
- high performance
- web and backend portability first
- a future path to broader native deployment

UPLim is AI-native, but not AI-dependent for compilation.

AI is a built-in runtime capability of the language and standard library.
Compilation, typing, and safety remain deterministic without model participation.

## 2. Product Direction

### v1 scope

UPLim v1 targets:

- CLI applications
- backend services
- web deployment through WebAssembly

Deferred beyond v1:

- full game engine ambitions
- desktop frameworks
- mobile-first platform tooling
- broad embedded support

### Implementation direction

- Canonical production compiler: Rust
- Current TypeScript packages: prototype and compatibility layer
- Stable portable runtime layer: Wasm components plus WIT and WASI
- Default runtime: Wasmtime
- First production backend: Cranelift
- Deferred native backend: LLVM
- Built-in AI surface: `std/ai`, structured outputs, tool calling, and MCP integration

## 3. Core Principles

1. **Safety first**
   - strong static typing
   - ownership and borrows
   - no implicit unsafe behavior
   - explicit capability boundaries

2. **Predictable compilation**
   - deterministic parser and diagnostics
   - explicit lowering pipeline
   - no AI in the semantic core

3. **Portable execution**
   - one codebase for web plus backend first
   - Wasm components as the default portable artifact
   - host integration through WIT and WASI
   - built-in AI runtime access through capability-gated providers

4. **Human-readable syntax**
   - inspired by Rust and TypeScript
   - formal grammar and clear errors
   - minimal ambiguity

5. **Tooling-friendly design**
   - strong LSP support
   - formatter, diagnostics, benchmarks, security analysis
   - Tree-sitter support for editors

## 4. Compilation Pipeline

The canonical pipeline is:

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

### Primary outputs

- Wasm component for portable execution
- JS output only for playground and interoperability

### Deferred output

- LLVM native binary

## 5. Runtime Model

UPLim v1 uses a small host ABI rather than a large framework runtime.

Runtime surface includes:

- filesystem
- clocks
- environment
- process
- HTTP
- async task primitives
- structured logging
- typed host errors
- AI model access
- typed tool calling
- MCP client access

Runtime surface excludes from v1:

- JVM bridge
- .NET bridge
- implicit ambient authority

## 6. Safety Model

UPLim adopts ownership and borrows as the long-term memory model.

Compiler responsibilities:

- detect invalid moves
- detect invalid aliasing
- reject unsafe mutable and immutable borrow combinations
- make resource cleanup explicit
- keep concurrency explicit and verifiable

## 7. Interoperability

### v1

- Wasm components
- WIT interface definitions
- WASI capability model
- JS interop for tooling and browser integration where needed
- provider-neutral AI integration
- structured AI outputs
- tool calling and MCP client support

### later phases

- richer native FFI
- LLVM-native interop surfaces

## 8. Editor and Tooling Model

- canonical compiler parser lives in Rust
- Tree-sitter is editor-only
- LSP diagnostics come from the compiler and semantic pipeline
- formatter and quick-fix systems must rely on compiler-owned syntax and spans

## 9. File And Module Model

UPLim source files use the `.upl` extension.

Canonical semantic filenames:

- `main.upl`
- `page.upl`
- `layout.upl`
- `route.upl`
- `server.upl`
- `mod.upl`

Module resolution rules:

- imports are module-based, not raw path-string based
- dotted module paths resolve to `.upl` files through manifest-defined roots
- `mod.upl` acts as the directory module root where needed
- app segments may use `page.upl` and `layout.upl` for route-facing structure
- the compiler should avoid ambiguous or multi-path lookup heuristics

## 10. AI-Native Boundary

AI is a built-in runtime subsystem of UPLim.

AI is allowed in:

- `std/ai`
- structured generation into typed values
- typed tool calling
- MCP-connected resources and tools
- analysis
- refactoring suggestions
- benchmarking assistance
- architecture and evolution recommendations

AI must not be required for:

- parsing
- type checking
- borrow checking
- code generation correctness

AI behavior must remain:

- capability-gated
- explicit in user code
- typed at the boundary
- replaceable across providers

## 11. Compatibility Rules

- existing TypeScript prototype packages remain useful for experimentation and migration
- new language semantics must be defined against the Rust core
- any compatibility layer must not block the production compiler roadmap

## 12. Canonical Supporting Docs

- `docs/production-architecture.md`
- `docs/toolchain-contracts.md`
- `docs/ai-native-architecture.md`
- `docs/file-and-module-conventions.md`
- `docs/gap-analysis.md`
- `docs/execution-roadmap.md`

These documents should be treated as the current architecture baseline for implementation.

These documents should be treated as the current architecture baseline for implementation.
