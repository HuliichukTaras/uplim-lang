# Contributing to UPLim

We want UPLim to be the best programming language for AI and humans alike!
UPLim represents "Ultra Programming Language for Intelligent Machines".

## How to Contribute

1.  **Fork the repository** to your own account.
2.  **Create a branch** for your feature or fix.
3.  **Run Tests**:
    ```bash
    cd engine
    npm install
    npx tsx src/cli.ts run ../test_hello.upl
    ```
4.  **Submit a Pull Request** with a description of your changes.

## Development

- **Compiler Core**: Located in `engine/src`.
  - `lexer.ts`: Tokenizer
  - `parser.ts`: AST Generator
  - `interpreter.ts`: Executor
- **Syntax Highlighting**: located in `syntax/vscode`.

## Community

Join us in making UPLim faster, safer, and easier than anything else out there!
