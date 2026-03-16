# UPLim Repository Index

This directory defines the current source of truth for the UPLim project.

## Canonical Documents

- [Production Architecture](production-architecture.md): target system design for the Rust-first production compiler and runtime.
- [Toolchain Contracts](toolchain-contracts.md): stable public interfaces for `uplimc`, `uplim.toml`, IR boundaries, and runtime contracts.
- [AI-Native Architecture](ai-native-architecture.md): first-class AI runtime design, typed model access, structured outputs, tool calling, and MCP integration.
- [std/ai API](std-ai-api.md): executable standard-library contract for typed generation, embeddings, tool calling, and MCP access.
- [File And Module Conventions](file-and-module-conventions.md): `.upl` file rules, special filenames, and deterministic module resolution.
- [Language Engineering Foundations](language-engineering-foundations.md): practical map of the technical subsystems needed to build a production language.
- [Gap Analysis](gap-analysis.md): delta between the current TypeScript prototype and the production language target.
- [Execution Roadmap](execution-roadmap.md): phased delivery plan from repo normalization to Wasm and native backends.
- [Core Specification](uplim-core-specification.md): product and language-level direction for UPLim v1.
- [Licensing](license.md): canonical licensing policy for the language, compiler, runtime, docs, and examples.
- The active prototype now includes a manifest-backed `build`, `render`, and `serve` pipeline for `.upl` projects via `packages/tooling` and `packages/cli`.

## Active Code

The active implementation work in this repository is currently centered on:

- `/packages/frontend`
- `/packages/runtime`
- `/packages/compiler-js`
- `/packages/tooling`
- `/packages/cli`
- `/packages/lsp`
- `/apps/website`
- `/apps/vscode-extension`

These packages form the live prototype stack and should be treated as the current executable baseline.

The canonical production path now starts in:

- `/crates/uplimc`
- `/crates/uplim_manifest`
- `/crates/uplim_parser`

## Reference-Only Areas

The following paths are reference material and should not be treated as canonical architecture without an explicit migration decision:

- `/engine`
- `/legacy`
- old root-level website and editor paths that were moved during the repo migration

## Current Project Direction

- Production compiler core moves to Rust.
- v1 targets web plus backend first.
- Ownership and borrows define the memory-safety model.
- Wasm components with WIT and WASI define the portable runtime boundary.
- Wasmtime is the default runtime.
- Cranelift is the first production backend.
- LLVM remains a deferred native optimization backend.
- Tree-sitter is for editor tooling, not the canonical compiler parser.
- AI is a first-class runtime capability, but not part of parser, type-checker, borrow-checker, or codegen nondeterminism.

## Supporting Documents

- `engine-*.md`: historical engine specs and ideas
- `project-architecture.md`: sample layout for a UPLim application, not the monorepo itself
- `standard-library.md`: early stdlib notes, superseded where newer architecture docs are more specific
- `roadmap.md`: legacy roadmap, kept for historical context only
