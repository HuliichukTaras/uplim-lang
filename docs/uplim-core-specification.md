# UPLim Language Spec
Version: 0.1-frozen

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

## 2. Frozen Core

UPLim v0.1 freezes one core language with one AST and one formatter shape.

Frozen constructs:

- `fn`, `let`, `var`, `const`
- `struct`, `state`, `enum`
- `if` plus readable `when ... do`
- `match`
- arrays, objects, comprehensions, ranges, pipelines
- `with` immutable update
- explicit typed state containers and reducer-style functions
- readable word-forms such as `be`, `plus`, and `equals`, lowering to the same semantics as symbolic forms

Explicit non-goals for v0.1:

- borrow checking
- generics
- policy DSL
- full agent DSL
- UI `component/view/Html`
- LLVM backend

## 3. Product Direction

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

## 4. Core Principles

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
   - one canonical syntax for all users
   - inspired by Rust and TypeScript, but not a copy of either
   - formal grammar and clear errors
   - minimal ambiguity
   - limited aliases may exist, but only where they do not meaningfully damage identifier freedom

5. **Tooling-friendly design**
   - strong LSP support
   - formatter, diagnostics, benchmarks, security analysis
   - Tree-sitter support for editors

## 5. Compilation Pipeline

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

## 6. Runtime Model

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

## 7. Safety Model

UPLim adopts ownership and borrows as the long-term memory model.

Compiler responsibilities:

- detect invalid moves
- detect invalid aliasing
- reject unsafe mutable and immutable borrow combinations
- make resource cleanup explicit
- keep concurrency explicit and verifiable

## 8. Interoperability

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

## 9. Editor and Tooling Model

- canonical compiler parser lives in Rust
- Tree-sitter grammar is the canonical editor grammar
- EBNF is the synchronized human-readable grammar artifact
- LSP diagnostics come from the compiler and semantic pipeline
- formatter and quick-fix systems must rely on compiler-owned syntax and spans

## 10. File And Module Model

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

## 11. AI-Native Boundary

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

## 12. Syntax Policy

UPLim should not split into separate language variants such as a "simple" mode and a "progressive" mode.

There is one canonical syntax.
That syntax may include a limited set of aliases for common declarations and output where they improve flow without creating a second dialect.

Current stable aliases:

- `l` for `let`
- `f` for `fn` and `func`
- `p` for `say` and `print`
- `m` for `match`

Aliases must follow these rules:

- they must stay readable in mixed codebases
- they must not reserve common single-letter variable names without strong justification
- they must not create a separate language mode or dialect
- they must lower to the same AST and semantics as the canonical forms

Readable word-forms are part of the same language, not a second mode:

- `be` lowers to declaration assignment
- `plus` lowers to `+`
- `equals` lowers to `==`
- `when ... do` lowers to `if`

The canonical formatter may normalize these forms into one stable printed style.

## 13. State And Reducer Model

UPLim v0.1 treats explicit state containers as core language style.

- `state` is a first-class declaration form for named typed state containers
- reducers are ordinary typed functions, not a separate runtime primitive
- `with` performs immutable structural update for object-like and named state values
- comprehensions remain ordinary expressions and may derive next-state values

Canonical example:

```upl
state AppState {
  message: String
  visits: Int
}

fn reducer(current: AppState) -> AppState {
  return current with { visits: current.visits + 1 }
}
```

## 14. Compatibility Rules

- existing TypeScript prototype packages remain useful for experimentation and migration
- new language semantics must be defined against the Rust core
- any compatibility layer must not block the production compiler roadmap

## 15. Canonical Supporting Docs

- `docs/production-architecture.md`
- `docs/toolchain-contracts.md`
- `docs/ai-native-architecture.md`
- `docs/file-and-module-conventions.md`
- `docs/gap-analysis.md`
- `docs/execution-roadmap.md`

These documents should be treated as the current architecture baseline for implementation.
