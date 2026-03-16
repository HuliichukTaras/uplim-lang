# UPLim Execution Roadmap

## Phase 0: Repository Normalization

- resolve documentation conflicts and establish canonical entry documents
- mark prototype versus reference-only areas clearly
- freeze strategic decisions for Rust core, AI-native runtime, Wasm components, Wasmtime, Cranelift, LLVM-later
- keep the TypeScript implementation buildable as a reference baseline

Exit criteria:

- `README.md` and `docs/index.md` point to the same architecture
- no merge markers remain in canonical docs
- production direction is documented in one place

## Phase 1: Rust Frontend Prototype

- create a Rust workspace for `uplimc`
- implement lexer, parser, AST, spans, and diagnostics
- establish formatter and golden tests
- mirror a minimal subset of existing syntax from the TypeScript parser

Exit criteria:

- Rust parser can parse a representative subset of current examples
- AST and diagnostics snapshots are stable
- formatter round-trips goldens

## Phase 2: Semantic Core

- implement module resolution
- implement HIR
- implement type inference and explicit type checking
- introduce `Result`, `Option`, generics, and typed diagnostics
- define typed MIR
- define type-to-JSON-schema derivation for AI-eligible types

Exit criteria:

- semantic tests pass for valid and invalid programs
- MIR snapshots are deterministic

## Phase 3: Ownership and Borrow Checking

- define move semantics
- define borrows and lifetime model for v1
- implement borrow-checking passes on MIR
- add diagnostics for moves, aliasing, use-after-move, invalid mutable borrows, and resource cleanup paths

Exit criteria:

- ownership test suite covers happy path and failure path cases
- borrow errors are precise enough for IDE display

## Phase 4: Wasm Runtime and Host ABI

- define WIT packages for the initial runtime surface
- pin against WASI 0.2+ contracts
- implement Wasmtime embedding for `uplimc run`
- define `uplim.toml` and capability gates
- build minimal stdlib modules around the host ABI
- implement `std/ai` host contracts for structured generation, embeddings, and typed tool calls

Exit criteria:

- simple CLI and HTTP examples run as Wasm components
- undeclared capability access is rejected
- typed AI requests and structured responses work through the runtime contract

## Phase 5: Cranelift Production Backend

- lower validated MIR into backend IR suitable for Cranelift
- implement codegen for v1 feature set
- support AOT and JIT where useful for backend workloads
- build parity tests versus reference execution

Exit criteria:

- backend parity suite passes for representative programs
- baseline benchmarks exist against the TypeScript prototype

## Phase 6: Tooling and Ecosystem

- implement `uplimc` command surface
- implement Rust-based LSP server
- integrate editor tooling with Tree-sitter plus compiler diagnostics
- implement package graph and dependency resolution
- harden benchmark and security workflows
- implement MCP client support and provider adapters for OpenAI-compatible, Anthropic-compatible, and local Ollama-compatible runtimes

Exit criteria:

- `check`, `build`, `run`, `test`, `fmt`, `lsp`, and `bench` are usable end to end

## Phase 7: LLVM and Expanded Targets

- define native-lowering path from validated MIR
- add LLVM backend
- expand target support for more native use cases
- revisit desktop, mobile, game, and embedded surfaces

Exit criteria:

- LLVM backend is optional, not required for the default toolchain
- native targets do not weaken ownership, capability, or runtime contracts
