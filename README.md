# UPLim — Universal Programming Language for Intelligent Machines

<div align="center">
  <h3>⚡️ Fast. 🛡️ Safe. 🧠 AI-Native. 🌍 Universal.</h3>
  <p>The programming language designed for the next generation of software.</p>
</div>

---

**UPLim** is a modern, high-performance programming language designed to run everywhere—from high-performance servers to web browsers and AI agents. It combines the speed of low-level languages with the simplicity of scripting languages.

> _"Better than TypeScript, faster than Python, safer than C."_

## ✨ Why UPLim?

- **🌍 Universal Compilation**: Write once, run everywhere. Compiles to **JavaScript** (Web/Node) and **Native/WASM** (High Performance).
- **🧠 AI-Native**: First-class support for AI agents and LLM integration (Planned).
- **🛡️ Memory Safe**: Designed with safety in mind to prevent common bugs.
- **⚡️ Blazing Fast**: Optimized compiler pipeline starting with a fast recursive descent parser.
- **🛠️ Batteries Included**: Comes with a CLI, compiler, and VSCode extension out of the box.

## 🚀 Getting Started

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-username/UPLim.git
cd UPLim/engine
npm install
```

### Running Your First Program

Create a file named `hello.upl`:

```upl
let message = "Hello World"
say message
```

Run it with the UPLim CLI:

```bash
npx tsx src/cli.ts run hello.upl
```

### Compiling to JavaScript (Web Support)

UPLim can compile directly to JavaScript to run in browsers or Node.js:

```bash
npx tsx src/cli.ts compile hello.upl -o hello.js
node hello.js
```

## 📖 Language Tour

### Variables

```upl
let name = "UPLim"
let version = 1.0
```

### Functions

Standard block functions:

```upl
fn add(a, b) {
    if a > 0 {
        say "Adding positive numbers"
    }
    // Implicit return of the last expression
    make res(x, y) => x + y
    res(a, b)
}
```

Compact lambda-style functions:

```upl
make square(x) => x * x
```

### Control Flow

```upl
let x = 10
if x > 5 {
    say "Greater than 5"
} else {
    say "Smaller or equal"
}
```

## 🗺️ Roadmap

- [x] **Core**: Lexer, Parser, Interpreter
- [x] **Web**: Transpiler to JavaScript
- [ ] **Native**: Compiler to WebAssembly (WASM)
- [ ] **Standard Library**: File IO, Networking, HTTP
- [ ] **AI**: Native `agent` keyword and LLM prompting

## 🛠️ Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to get started.

## 📄 License

This project is licensed under the [MIT License](LICENSE) - see the file for details.

---

Built with ❤️ for the future of coding.
