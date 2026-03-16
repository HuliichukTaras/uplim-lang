# Language Engineering Foundations For UPLim

This document summarizes the core technical areas required to build a production programming language.

It is written as a practical checklist for UPLim, not as academic theory.

## 1. Language Definition

Before codegen or runtime work, the language must define:

- syntax
- grammar
- module system
- type system
- execution model
- error model
- package model

If these are vague, the compiler becomes unstable and every backend diverges.

For UPLim this means:

- one canonical grammar
- one canonical module resolution model
- one canonical type and ownership model
- one canonical runtime capability model

## 2. Lexer And Parser

The frontend starts with:

- lexer
- parser
- source spans
- syntax diagnostics

Responsibilities:

- convert source text into tokens
- validate syntax
- produce AST
- preserve enough span data for IDEs, formatter, and diagnostics

For UPLim:

- Rust parser is canonical
- Tree-sitter is editor-only
- `.upl` is the only source extension

## 3. AST

The AST is the syntax-owned representation of user code.

It should:

- stay close to source shape
- preserve structure and spans
- avoid backend-specific concepts

The AST is not the final semantic model.
It is only the first stable compiler-owned data structure.

## 4. Semantic Analysis

After parsing, the compiler needs semantic passes:

- module resolution
- symbol table construction
- name resolution
- visibility checks
- type inference
- type checking
- effect or capability validation

For UPLim, semantic analysis must also prepare:

- ownership
- borrows
- async boundaries
- AI capability declarations

## 5. Intermediate Representations

A serious language needs more than one IR layer.

Recommended stack for UPLim:

- AST
- HIR
- typed MIR
- borrow-checked MIR
- backend IR

Why this matters:

- syntax sugar should disappear before backend work
- types should be resolved before optimization
- ownership and borrow constraints should be validated before codegen
- backends should receive a stable lowered form

## 6. Type System

A production type system must define:

- primitive types
- structs and enums
- generics
- traits or interfaces if supported
- `Result` and `Option`
- function signatures
- async return behavior

For UPLim, the type system also needs to support:

- schema-derivable AI response types
- typed tool signatures
- capability-checked host APIs

## 7. Ownership And Safety

Because UPLim aims to be fast and safe, memory safety cannot be left vague.

The compiler must define:

- ownership
- moves
- immutable borrows
- mutable borrows
- lifetime constraints
- resource cleanup rules

This is one of the most important design boundaries in the whole language.

## 8. Runtime And ABI

The runtime is not just “something that runs the code”.
It is the contract between compiled programs and the host environment.

For UPLim v1, the runtime should define:

- Wasm component artifact format
- WIT interfaces
- WASI capabilities
- Wasmtime host execution
- HTTP, filesystem, environment, process, clocks, async tasks
- AI runtime capabilities

This is also where portability is won or lost.

## 9. Code Generation

Backends are not the language.
They are consumers of the validated semantic core.

UPLim strategy:

- Cranelift first
- LLVM later
- JS output only as fallback or playground interop

The backend should never be forced to guess about unresolved types or ownership behavior.

## 10. Standard Library

The standard library defines how the language feels in real use.

It should be:

- small at first
- typed
- capability-aware
- portable
- consistent with the runtime ABI

For UPLim v1, priority stdlib areas are:

- core
- collections
- io
- http
- async
- ai

## 11. Tooling

A real language also needs:

- formatter
- test runner
- LSP
- diagnostics model
- benchmark tooling
- package manager

Without these, the language remains a prototype no matter how good the compiler is.

## 12. AI-Native Layer

AI-native does not remove the need for compiler rigor.
It adds a new runtime and stdlib subsystem.

UPLim AI-native layer should include:

- `std/ai`
- provider abstraction
- structured outputs
- typed tool calling
- MCP client support
- explicit capability gates

It should not move semantic correctness into model inference.

## 13. Tests And Verification

A language project needs several test layers:

- grammar goldens
- parser error snapshots
- semantic validity and invalidity cases
- ownership tests
- backend parity tests
- runtime integration tests
- benchmark baselines

For UPLim this is mandatory because multiple execution modes will coexist during transition.

## 14. UPLim-Specific Build Order

The safest order for UPLim is:

1. canonical docs and file/module conventions
2. Rust parser and AST
3. module resolution and type checking
4. typed MIR
5. ownership and borrow checker
6. Wasm runtime ABI and `uplim.toml`
7. AI-native runtime contracts
8. Cranelift backend
9. LSP and package manager
10. LLVM backend

## 15. Main Mistakes To Avoid

- mixing prototype runtime behavior with final semantics
- letting the backend define the language
- introducing AI into compile-time correctness
- adding syntax before defining semantics
- making module resolution ambiguous
- building too much stdlib before stabilizing ABI
- trying to ship all targets at once

## 16. What This Means For UPLim

UPLim should be designed as:

- a deterministic Rust compiler
- a capability-gated Wasm-first runtime
- an AI-native standard library and runtime layer
- a language with explicit `.upl` file conventions
- a system that can later expand to more native targets without redefining its semantics
