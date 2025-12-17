# Uplim Project Structure

Welcome to the Uplim programming language repository.

## Directory Layout

### `/src` - Core Engine

Contains the implementation of the Uplim language.

- `lexer.ts`: Tokenizer
- `parser.ts`: Recursive descent parser
- `interpreter.ts`: AST walker and runtime
- `engine.ts`: Main orchestration class
- `cli.ts`: Command-line interface definition

### `/website` - Official Website

The source code for `uplim.org`.

- Built with **Next.js** (App Router) and **Tailwind CSS**.
- **Playground**: `/app/page.tsx` contains the editor, and `/app/api/execute` handles code execution via the CLI.
- **Documentation**: `/app/docs` contains the user-facing documentation keys.

### `/examples`

Sample UPLim programs.

- `hello.upl`: Basic hello world
- `fib.upl`: Fibonacci sequence
- `test_v02.upl`: Feature verification files

### `/tests`

Integration and unit tests.

- `compressed_mode.uplim`: Specific tests for compressed syntax.
- `test_uplim.py`: Python-based test runner.

### `/tools`

Scripts and utilities for maintenance and build processes.

## Getting Started

1. **Install Dependencies**: `npm install`
2. **Build Engine**: `npm run build`
3. **Run Website**: `cd website && npm run dev`
