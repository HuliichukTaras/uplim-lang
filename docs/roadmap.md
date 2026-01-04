# UPLim Roadmap

## Phase 1: Foundation (Current)

- [x] **Interpreter**: Basic TypeScript-based interpreter.
- [x] **REPL**: CLI-based interactive shell.
- [x] **Web Deployment**: Flask API on Render.
- [ ] **Basic Syntax**: Variable declaration, loops, functions.

## Phase 2: Compiler & Safety (Next)

- [ ] **Dual Syntax Support**: Implementing Verbose and Compressed parsers.
- [ ] **Type System**: Introduction of `Option<T>` and strict typing.
- [ ] **Modular Architecture**: Splitting Parser, AST, and Backend.
- [ ] **WebAssembly Prototype**: First successful compile to Wasm.

## Phase 3: Ecosystem & Tools

- [ ] **Package Manager**: `uplim install`.
- [ ] **Standard Library**: IO, Networking, Math, Strings.
- [ ] **IDE Support**: VS Code Extension with LSP.
- [ ] **Web IDE**: Full-featured online playground.

## Phase 4: Performance & Native

- [ ] **LLVM Backend**: Native machine code generation.
- [ ] **Optimizer**: Dead code elimination, constant folding.
- [ ] **Concurrency**: Async/Await primitives and lightweight threads.
