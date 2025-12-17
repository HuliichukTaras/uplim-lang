# UPLim Engine – Full Specification

## Architecture Overview

The UPLim Engine is a self-improving system that analyzes, tests, and evolves the UPLim programming language.

### Core Components

1. **Compiler API** - Parse, analyze, and compile UPLim code
2. **LSP Server** - Language Server Protocol for IDE integration
3. **Engine Modules**:
   - `rules` - Language rules and constraints
   - `analysis` - Static code analysis
   - `security` - Vulnerability scanning
   - `tester` - Performance benchmarking
   - `ai` - LLM integration for suggestions
   - `evolver` - Language evolution proposals
   - `storage` - Profile and history storage
   - `editor` - Editor integrations

## Compiler API

### Core Functions

- `parse_file(path, opts)` - Parse UPLim source file
- `parse_source(code, opts)` - Parse source code string
- `analyze_ast(ast, opts)` - Type check and analyze AST
- `compile_project(entry, opts)` - Compile to target (native/WASM/bytecode)
- `get_project_handle(root)` - Get project interface

### Types

- `ParseResult` - AST + diagnostics
- `AnalyzeResult` - Type checking + flow analysis results
- `CompileResult` - Compilation output + diagnostics

## LSP Integration

### Standard Methods

- `initialize` - Initialize language server
- `textDocument/didOpen` - Document opened
- `textDocument/didChange` - Document changed
- `textDocument/didSave` - Document saved

### Custom UPLim Methods

- `uplim/engineReport` - Get full engine analysis
- `uplim/projectHealth` - Get project health status
- `uplim/quickFixes` - Get quick fix suggestions

## Engine Workflow

1. **Parse** - Convert source to AST
2. **Analyze** - Apply rules, check types
3. **Security Scan** - Find vulnerabilities
4. **Benchmark** - Run performance tests (if enabled)
5. **AI Suggestions** - Generate improvement proposals
6. **Evolution** - Propose language changes
7. **Storage** - Save report and history

## AI Integration

### OpenAI Module

- Model: `gpt-4o-mini` (default)
- Max tokens: 2000
- Temperature: 0.7
- System prompt: "You are a UPLim language assistant"

### Safety Rules

- AI never modifies code automatically
- Only generates suggestions
- Must follow UPLim principles (simplicity, safety, clarity)
- Suggestions validated against ideology

## Configuration

### Engine Config

\`\`\`typescript
{
  enableAI: boolean,
  aiProvider: "openai",
  aiApiKey: string | null,
  performanceProfilePath: string
}
\`\`\`

### VS Code Settings

- `uplim.compilerPath` - Path to compiler
- `uplim.engine.enableAI` - Enable AI suggestions
- `uplim.engine.aiProvider` - AI provider
- `uplim.engine.apiKey` - API key

## Performance

- Incremental parsing and analysis
- Cached AST between edits
- Async operations for benchmarks
- Debounced diagnostics updates

## Security

The engine scans for:
- Thread safety violations
- Memory safety issues
- Unvalidated user inputs
- Unsafe FFI calls
- Resource leaks

## Evolution Process

1. Collect analysis data
2. Generate heuristic suggestions
3. Query AI for improvements (if enabled)
4. Merge and deduplicate suggestions
5. Validate against UPLim ideology
6. Present to user for review
7. Never auto-apply changes

This specification defines the complete UPLim Engine implementation.
