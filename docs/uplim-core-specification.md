# UPLim Language – Universal Compatibility Core Specification
Version: 1.1

## 1. Purpose

UPLim is a next-generation, general-purpose, compiled programming language designed to be:

- universal
- safe
- simple to use
- extremely fast
- modern and AI-aware
- suitable for everything: games, mobile apps, web apps, servers, desktop, automation, embedded

UPLim is not a framework or a wrapper. It is a full programming language with its own compiler, engine and ecosystem.

The main design goal:
> Write UPLim once, run it everywhere, without forcing the developer to switch languages or stacks.

---

## 2. Core Principles

1. **Full standalone language**  
   UPLim is comparable to C++, Rust, Go and TypeScript in scope, but designed to be:
   - simpler
   - safer
   - more uniform
   - more cross-platform

2. **Universal compilation targets**  
   UPLim code is always compiled, never interpreted at runtime by default.  
   UPLim has a multi-stage compilation pipeline:

   - Frontend:
     - UPLim source → AST → High-Level IR (HLIR)
   - Middle:
     - HLIR → UPLim Universal IR (UIR)
   - Backends:
     - UIR → WebAssembly (WASM)
     - UIR → LLVM IR → native binaries (Linux, macOS, Windows, mobile, embedded)
     - UIR → JavaScript / TypeScript (fallback, scripting and rapid integration)
   
   This design makes UPLim effectively "understandable" by:
   - all modern browsers (through WebAssembly or JS)
   - any platform supported by LLVM
   - any environment that can host WASM

3. **One language for everything**  
   UPLim is used to build:
   - backend microservices and APIs
   - web applications (via WASM and UI frameworks)
   - mobile apps (through native or WASM-based runtimes)
   - desktop apps
   - serverless functions
   - batch jobs and automation
   - games and interactive content
   - embedded and IoT components (via LLVM/native targets)

4. **Safety and simplicity first**  
   UPLim guarantees:
   - strong static typing
   - memory safety and thread safety enforced by the compiler
   - clear and readable syntax inspired by TypeScript and Rust, but simpler
   - no uncontrolled implicit behaviour
   - explicit concurrency and resource handling

5. **Self-improving engine (meta layer)**  
   UPLim includes a self-improving Engine that:
   - analyzes language behaviour
   - benchmarks generated code
   - evaluates safety patterns
   - proposes language and compiler improvements
   - can optionally integrate with AI (OpenAI or others)
   The Engine does not replace the language. It improves its internals and tooling.

---

## 3. Universal Compilation Model

### 3.1. Primary target: WebAssembly

- All UPLim projects can be compiled to WebAssembly.
- This makes UPLim universal for:
  - all modern browsers
  - many servers (via WASM runtimes)
  - sandboxed execution environments

Benefits:
- same UPLim code can run in browser and on server
- safe, sandboxed execution
- predictable performance

### 3.2. Native targets via LLVM

- UPLim compiler can emit LLVM IR.
- From LLVM, UPLim supports:
  - Linux (x86_64, ARM)
  - macOS
  - Windows
  - iOS, Android (via native)
  - embedded targets (depending on LLVM support)

This allows:
- high performance native servers
- native desktop apps
- native mobile components
- low-level systems programming where needed

### 3.3. JavaScript / TypeScript fallback

- For environments where WASM is limited or JS is required, UPLim can:
  - transpile UIR → idiomatic JS/TS
  - provide a runtime shim for specific APIs

Use cases:
- scripts in existing JS ecosystems
- integration with Node.js or Deno
- rapid prototyping

---

## 4. Interoperability (FFI and Host Integration)

UPLim provides a unified FFI layer:

- **C ABI bridge** for low-level libraries and OS integration
- **JS bridge** for browsers and Node/Deno
- optional **JVM bridge** (bytecode wrappers)
- optional **.NET bridge** (IL wrappers)

The goal:
- UPLim can call existing libraries
- existing ecosystems can embed and call UPLim modules

---

## 5. Language Properties

1. **Strong static typing**  
   - types inferred where possible but always explicit in behaviour  
   - no implicit `any` or unsafe casts

2. **Deterministic syntax**  
   - minimal symbols
   - no ambiguous constructs
   - everything is predictable and easy to parse

3. **Expressive but compact**  
   - functional-style helpers where useful
   - clear async/concurrency model
   - modules, types, generics, traits/interfaces

4. **Safe concurrency**  
   - explicit concurrency primitives
   - compiler-enforced race detection (where possible)
   - recommended patterns for multi-core and async

5. **No hidden magic**  
   - no global mutable state by default
   - no uncontrolled reflection that breaks safety
   - meta-programming is explicit and controlled

---

## 6. Integration with Editors (VS Code and others)

UPLim is designed to be used from any modern editor through:

- **Language Server Protocol (LSP)** implementation
- syntax highlighting
- IntelliSense/autocomplete
- diagnostics (errors, warnings, security hints)
- code formatting
- quick fixes and refactoring tools

The Engine is integrated with the LSP server, so:

- editors get real-time feedback from:
  - compiler
  - static analysis
  - security analysis
  - performance hints
  - optional AI suggestions

---

## 7. AI Integration (Optional)

UPLim can use AI for:

- advanced static analysis
- pattern recognition in large codebases
- high-level suggestions for:
  - refactoring
  - performance improvements
  - language evolution ideas

Technical model:

- Engine has an `ai` module that can call external LLMs (OpenAI or others).
- API keys and provider details are provided by the user.
- AI never changes code automatically:
  - it only produces suggestions
  - the developer stays in full control

---

## 8. Design Rules Summary

When implementing or extending UPLim:

1. Always target **universality**:
   - at least WASM and LLVM
   - JS/TS fallback as needed

2. Always preserve **safety and simplicity**:
   - no "clever" syntax that confuses readability
   - no unsafe defaults

3. Always keep **one-language philosophy**:
   - backend, frontend, mobile, desktop, server, embedded – all in UPLim

4. Always keep **compatibility**:
   - do not break existing UPLim code without a migration path

5. Always keep **AI optional**:
   - UPLim and its compiler must work without AI
   - AI is an accelerator, not a requirement

6. Always be **editor-friendly**:
   - LSP support
   - predictable diagnostics
   - clean error messages

---

## 9. High-Level Example (Conceptual)

```uplim
module App.Main

import Net.Http
import UI.Component

type User {
  id: Id
  name: String
}

fn fetch_user(id: Id): Result<User> {
  let res = Http.get("/api/user/" + id.to_string())
  return res.decode_json<User>()
}

component UserCard(props: { id: Id }) {
  let user = fetch_user(props.id)

  render {
    if user.is_ok() {
      <div>
        <h1>{ user.value.name }</h1>
      </div>
    } else {
      <div>Error loading user</div>
    }
  }
}
