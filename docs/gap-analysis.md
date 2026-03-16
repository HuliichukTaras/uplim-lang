# UPLim Gap Analysis

This document compares the active repository state with the target production architecture.

## Executive Summary

UPLim already has a meaningful prototype stack, but it is still a prototype stack:

- parser and AST exist
- interpreter exists
- JavaScript emission exists
- CLI exists
- LSP exists
- analysis and engine-style tooling exist

The repository does not yet contain the core building blocks required for a production language runtime and compiler targeting universal deployment.

## What Exists Now

### Frontend and language prototype

- `packages/frontend` contains a lexer, recursive descent parser, AST node model, and parse diagnostics.
- `packages/runtime` contains a TypeScript interpreter that can execute a subset of the language.
- `packages/compiler-js` can emit JavaScript from the current AST.

### Developer tooling

- `packages/cli` exposes prototype commands for running, compiling to JS, checking, formatting, and simple AI access.
- `packages/lsp` provides a language server around the existing parser and tooling API.
- `packages/tooling` contains analysis, security, benchmarking, engine orchestration, and compiler API scaffolding.

### Product surfaces

- `apps/website` hosts the public website and playground.
- `apps/vscode-extension` hosts the editor client.

## Critical Gaps

### Compiler core

Missing:

- Rust compiler workspace
- canonical Rust parser
- HIR
- typed MIR
- borrow-checked MIR
- backend IR boundary
- deterministic lowering pipeline

Impact:

- no production-grade compilation path
- no semantic core that can support multiple backends safely

### Type and safety system

Missing:

- ownership and borrow semantics
- lifetime model
- capability-aware runtime checks
- stable generics story
- formal `Result` and `Option` typing across the compiler pipeline

Impact:

- safety claims are not compiler-enforced end to end
- concurrency and resource handling are still largely conceptual

### Runtime and ABI

Missing:

- Wasm component output
- WIT contract definitions
- WASI capability model
- Wasmtime embedding layer
- host ABI definition
- stable package manifest
- AI-native runtime contract
- typed model access APIs
- structured output validation pipeline
- tool-calling runtime loop
- MCP client support

Impact:

- no portable production runtime
- no sandboxed deployment contract for web and backend targets

### Backends

Missing:

- Cranelift integration
- Wasm code generation pipeline
- LLVM backend
- parity and benchmarking framework across execution modes

Impact:

- current backend story is limited to JS emission and interpretation

### Package and ecosystem

Missing:

- `uplim.toml`
- package graph and dependency resolution
- stdlib layout for IO, HTTP, async tasks, and structured errors
- artifact packaging and distribution model
- AI provider configuration model
- capability-gated local versus remote model strategy

Impact:

- no reproducible project model for serious applications

## Architecture Risks In The Current State

- `README.md` previously contained unresolved merge markers, which made the project entrypoint unreliable.
- `docs/index.md` and several older docs still described the TypeScript prototype as canonical instead of clearly marking it as transitional.
- `engine/` and `legacy/` contain overlapping ideas and duplicated concepts that can confuse implementation unless clearly marked as reference-only.
- The current CLI name and commands are useful for the prototype, but they are not yet formalized as a stable production toolchain contract.
- Existing AI code paths are provider calls and suggestions, not a first-class language/runtime feature.

## Decision Summary

To close the gap, UPLim should implement:

1. Rust-based compiler frontend as the new canonical source of truth.
2. Wasm components plus WIT and WASI as the v1 portability layer.
3. Wasmtime as the default runtime.
4. Cranelift as the first production backend.
5. LLVM only after the core IR and runtime ABI stabilize.
6. Tree-sitter only for editor tooling.
7. AI as a built-in runtime capability with typed schemas, tool calling, and MCP support, while keeping compiler semantics deterministic.
