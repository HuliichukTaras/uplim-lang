# Contributing to UPLim

We want UPLim to be the best programming language for AI and humans alike!
UPLim represents "Ultra Programming Language for Intelligent Machines".

## How to Contribute

1.  **Fork the repository** to your own account.
2.  **Create a branch** for your feature or fix.
3.  **Run Tests**:
    ```bash
    npx pnpm install
    npx tsx packages/cli/src/cli.ts run examples/hello_world.upl
    python3 test_uplim.py
    ```
4.  **Submit a Pull Request** with a description of your changes.

## Development

- **Frontend**: `packages/frontend/src` contains the lexer, parser, and AST types.
- **Runtime**: `packages/runtime/src` contains the interpreter and execution environment.
- **Compiler JS**: `packages/compiler-js/src` contains the JavaScript emitter backend.
- **Tooling**: `packages/tooling/src` contains analysis, engine orchestration, and compiler API services.
- **Facade**: `packages/core/src` re-exports the public `uplim-engine` API.
- **CLI**: Located in `packages/cli/src`.
- **LSP**: Located in `packages/lsp/src`.
- **VS Code Extension**: Located in `apps/vscode-extension`.
- **Syntax Highlighting**: located in `syntax/vscode`.
- **Historical Prototypes**: located in `legacy/` and excluded from the active build graph.

## Community

Join us in making UPLim faster, safer, and easier than anything else out there!
