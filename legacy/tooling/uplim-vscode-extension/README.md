# UPLim VS Code Extension

Official Visual Studio Code extension for **UPLim** - The Human Programming Language.

## Features

- **Syntax Highlighting**: Colorization for keywords, types, and control structures.
- **Language Server**: Basic diagnostics and error checking (via `uplim-lsp`).

## Development Setup

1. **Install Dependencies**:

   ```bash
   cd uplim-lsp && npm install
   cd ../uplim-vscode-extension && npm install
   ```

2. **Compile**:

   ```bash
   # Compile LSP
   cd uplim-lsp && npm run compile

   # Compile Extension
   cd ../uplim-vscode-extension && npm run compile
   ```

3. **Run**:
   - Open `uplim-vscode-extension` in VS Code.
   - Press `F5` to launch a new Extension Development Host window.
   - Open a `.upl` file to see syntax highlighting and LSP in action.

## Structure

- `uplim-lsp`: The Language Server (Node.js).
- `uplim-vscode-extension`: The VS Code Client that connects to the server.
