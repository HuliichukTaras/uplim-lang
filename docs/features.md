# UPLim Features

## Core Philosophy

**Simple. Fast. Safe. Everywhere.**

## Key Features

### 1. Dual Syntax Modes

UPLim is designed to be readable by everyone, but writably efficient for experts.

- **Verbose Mode**: Natural language syntax for beginners and readability.
  ```uplim
  let number be 10 asks "Give me a number"
  when number is greater than 5 do say "Big!"
  ```
- **Compressed Mode**: Concise, symbolic syntax for rapid development.
  ```uplim
  let n = 10;
  if (n > 5) print("Big!");
  ```

### 2. Safety First

- **No Null Pointer Exceptions**: `null` is not a valid value for standard types. We use `Option` types to handle absence of value explicitly.
- **Memory Safety**: Automatic memory management via ARC (Reference Counting) or compile-time Borrow Checking. No heavy Garbage Collector pauses.

### 3. Multi-Platform

- **Web Native**: Compiles to WebAssembly (Wasm) for high-performance web applications.
- **Native**: Compiles to machine code via LLVM for desktop and server performance.
- **Interpreted**: Instant feedback REPL for learning and scripting.

### 4. Modern Tooling

- **Built-in Testing**: `test` keyword included in the language.
- **Built-in Formatter**: `uplim fmt` standardizes code style.
- **LSP Support**: Language Server Protocol for IDE integration (VS Code, etc.).
