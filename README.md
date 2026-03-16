# UPLim

UPLim is a programming language project aimed at a human-readable, safe, high-performance toolchain for web and backend workloads first, with a future path to broader native targets.

The repository currently contains an active TypeScript prototype stack for parsing, interpretation, JavaScript emission, LSP, and website tooling. That stack remains useful for experimentation and compatibility, but it is not the long-term production compiler core.

The Rust production path now has a canonical workspace scaffold in `crates/` with `uplimc`, `uplim_manifest`, and `uplim_parser`.

## Current Direction

- Production core: Rust-based compiler and runtime architecture
- v1 scope: web plus backend first
- Safety model: ownership and borrows
- Primary portable artifact: Wasm components with WIT and WASI
- Default runtime: Wasmtime
- First production backend: Cranelift
- Deferred native optimization backend: LLVM after the core pipeline and ABI stabilize
- AI: built-in runtime capability with typed APIs, structured outputs, tool calling, and provider abstraction; compiler remains deterministic

## Repository Status

The active monorepo implementation today lives across:

```text
apps/
  website/            Next.js website and playground
  vscode-extension/   VS Code client
packages/
  frontend/           Lexer, parser, AST, diagnostics
  runtime/            TypeScript interpreter and execution environment
  compiler-js/        JavaScript emitter backend
  tooling/            Analysis, compiler API, engine orchestration, LSP-facing services
  core/               uplim-engine compatibility facade
  cli/                uplim command line interface
  lsp/                Language Server implementation
crates/
  uplimc/             Rust compiler CLI scaffold
  uplim_manifest/     Rust uplim.toml parser and validator
  uplim_parser/       Rust lexer/parser/diagnostics scaffold
engine/               Historical engine prototype kept as reference
legacy/               Historical prototypes and experiments
```

Source-of-truth documents for the current strategy:

- [Repository Index](docs/index.md)
- [Production Architecture](docs/production-architecture.md)
- [Toolchain Contracts](docs/toolchain-contracts.md)
- [AI-Native Architecture](docs/ai-native-architecture.md)
- [Gap Analysis](docs/gap-analysis.md)
- [Execution Roadmap](docs/execution-roadmap.md)
- [Core Specification](docs/uplim-core-specification.md)
- [Licensing](docs/license.md)

## Quick Start

Install dependencies:

```bash
npx pnpm install
```

Run the TypeScript prototype CLI:

```bash
npx tsx packages/cli/src/cli.ts run examples/hello_world.upl
```

Build a full UPLim project from `uplim.toml`:

```bash
npx tsx packages/cli/src/cli.ts build examples/web_app
```

Render the generated HTML shell for a route:

```bash
npx tsx packages/cli/src/cli.ts render examples/web_app --route /dashboard --stdout
```

Start the external compatibility engine and serve the built project:

```bash
npx tsx packages/cli/src/cli.ts serve examples/web_app --port 3000
```

Build the active TypeScript workspace:

```bash
npx pnpm run build
```

Run the website:

```bash
cd apps/website
npx pnpm dev
```

Run the current test suite:

```bash
npx pnpm test
```

## What Exists Today

- Recursive descent parser and AST in `packages/frontend`
- Reference interpreter in `packages/runtime`
- JavaScript emitter in `packages/compiler-js`
- Project-aware build, render, and serve pipeline in `packages/tooling` and `packages/cli`
- Rust workspace scaffold for `uplimc`, manifest validation, and Phase 1 parsing in `crates/`
- CLI and LSP in `packages/cli` and `packages/lsp`
- Research and architecture docs for the Rust-first production direction in `docs/`

## What Does Not Exist Yet

- Rust compiler frontend
- HIR and typed MIR pipeline
- Borrow checker
- Wasm component backend
- Wasmtime-based production runtime
- Cranelift codegen pipeline
- LLVM backend
- Production standard library and capability model

## Research Notebook

NotebookLM notebook for this repo:

- [UPLim Language Architecture Research](https://notebooklm.google.com/notebook/20c24a5e-54ec-4759-950d-321830344eed)

The notebook contains internal UPLim docs plus official sources for LLVM, Cranelift, Wasmtime, WASI, the WebAssembly Component Model, Tree-sitter, and Rust ownership.

## Guidance

- Treat `packages/*` as the active prototype surface.
- Treat `engine/` and `legacy/` as reference material unless a document explicitly promotes something back into the active design.
- Do not design new language features around the long-term TypeScript runtime.
- Treat AI as a first-class runtime capability, not as nondeterministic compiler behavior.

License: [MIT](/Users/tarashuliichuk/MyProjects/UPLim/LICENSE)
