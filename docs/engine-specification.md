# UPLim Engine Specification

## Architecture Overview

### Core Layers

1. **Language Core** (Compiler + Runtime)
   - Parser (source → AST)
   - Type checker
   - Optimizer
   - Codegen (Machine code / WASM)
   - Runtime (standard library, core services)

2. **UPLim Engine** (Self-Improvement System)
   - `/rules` – Language, style, and safety rules
   - `/analysis` – Static analysis and AST inspection
   - `/tester` – Performance benchmarks and stress tests
   - `/security` – Security vulnerability scanning
   - `/ai` – LLM integration for suggestions
   - `/evolver` – Language evolution proposal generator
   - `/storage` – Performance profiles and analysis history
   - `/interface` – API for Compiler, LSP, CLI, editors
   - `/editor` – LSP server and IDE support

3. **Integration Layer**
   - CLI (`uplim-cli`)
   - LSP Server (`uplim-lsp`)
   - Editor extensions (VS Code, JetBrains, Neovim)

### Data Flow

1. Developer writes code in editor (VS Code)
2. Editor sends file content → LSP via Language Server Protocol
3. LSP calls Compiler API:
   - `parse` → AST
   - `analyze` → Diagnostics
4. Engine processes:
   - `analysis` collects metadata
   - `security` scans AST for vulnerabilities
   - `tester` runs performance benchmarks (background)
   - `evolver` uses `ai` + `storage` → generates language improvement proposals
5. LSP shows diagnostics, hints, quick fixes, recommendations

## Module Specifications

### /rules Module

Defines language rules for syntax, style, safety, and performance.

**Key Components:**
- `RuleKind`: 'syntax' | 'style' | 'safety' | 'performance'
- `Rule`: Individual rule with ID, kind, description, and apply function
- `RulesRegistry`: Collection of all active rules

**Built-in Rules:**
- `no-implicit-any`: Require explicit type annotations
- `no-unchecked-concurrency`: Safe concurrency primitives required
- `consistent-naming`: Enforce snake_case naming convention
- `no-unbounded-loops`: Loops must have guards or max iterations

### /analysis Module

Performs static analysis on UPLim code.

**Outputs:**
- `Diagnostics`: List of issues found (info/warning/error)
- `ProjectMetrics`:
  - Total lines of code
  - Total functions
  - Average cyclomatic complexity
  - Type coverage percentage

**Process:**
1. Load all AST files from project
2. Walk each AST with all rules
3. Collect diagnostics
4. Compute aggregate metrics

### /security Module

Scans for security vulnerabilities.

**Categories:**
- **Concurrency**: Unsafe concurrent access patterns
- **Memory**: Manual allocation, unchecked buffer operations
- **Validation**: Unvalidated external inputs

**Severity Levels:**
- `low`, `medium`, `high`, `critical`

### /tester Module

Runs performance benchmarks.

**Metrics per Function:**
- Average execution time (nanoseconds)
- Max execution time
- Memory usage (bytes)

**Suggestions:**
- Flag functions slower than 1ms
- Flag memory usage > 1MB
- Compare against historical profiles

### /ai Module

Integrates with LLMs for advanced suggestions.

**Providers:**
- OpenAI (gpt-4o, gpt-4o-mini)
- Anthropic (claude)
- Local models via Ollama

**Use Cases:**
- High-level language design recommendations
- Complex code pattern analysis
- Evolution proposal generation

**Safety:**
- All prompts sanitized
- No automatic code modification
- Suggestions reviewed by human

### /evolver Module

Generates language evolution proposals.

**Process:**
1. Collect analysis, security, and performance data
2. Derive heuristic suggestions based on metrics
3. If AI enabled, generate AI-powered suggestions
4. Merge and deduplicate suggestions
5. Sort by priority (critical issues first)

**Constraints:**
- No breaking changes without major version bump
- Maintain backward compatibility
- Never increase syntax complexity unnecessarily
- Always prioritize safety and performance

### /storage Module

Persists analysis results and performance profiles.

**Data Stored:**
- Analysis reports with timestamps
- Security scan results
- Performance benchmark history
- Evolution proposals

**Operations:**
- `saveReport`: Store complete analysis report
- `loadReports`: Retrieve historical reports
- `getLatestReport`: Get most recent analysis

### /interface Module

Main API for Engine integration.

**Core Functions:**
- `initEngine(config)`: Initialize engine with configuration
- `analyzeProject(context, project)`: Run complete analysis
- `getEngineReport()`: Retrieve full analysis report

**Configuration:**
- `enableAI`: Toggle AI-powered suggestions
- `aiProvider`: Choose LLM provider
- `aiApiKey`: API key for LLM service
- `performanceProfilePath`: Storage location

## LSP Specification

### Standard LSP Methods

- `initialize`
- `textDocument/didOpen`
- `textDocument/didChange`
- `textDocument/didSave`
- `textDocument/didClose`
- `textDocument/publishDiagnostics`
- `textDocument/completion`
- `textDocument/hover`
- `textDocument/definition`
- `textDocument/references`
- `textDocument/rename`
- `textDocument/formatting`

### Custom UPLim Methods

**`uplim/engineReport`**
- Request: `{ uri: string }`
- Response: Full engine analysis report

**`uplim/quickFixes`**
- Request: `{ uri: string, range: Range }`
- Response: List of AI-generated quick fixes

**`uplim/projectHealth`**
- Request: `{ rootUri: string }`
- Response: Project health score (0-100) and summary

## OpenAI Integration

### Configuration

```typescript
interface OpenAIConfig {
  apiKey: string
  baseUrl: string
  model: 'gpt-4o' | 'gpt-4o-mini' | string
  maxTokens: number
}
```

### System Prompt

"You are a UPLim language assistant. Provide concise, actionable suggestions for language improvements."

### Request Format

```json
{
  "kind": "language-evolution",
  "payload": {
    "summary": "Project metrics and issues",
    "constraints": [
      "do not break backward compatibility",
      "never increase syntax complexity unnecessarily",
      "prioritize safety and performance"
    ]
  }
}
```

### Response Parsing

- Expects JSON array of suggestions
- Falls back to newline-delimited text
- Sanitizes and validates all outputs

## Safety Mechanisms

1. **No Automatic Modification**: Engine never changes code automatically
2. **Human Review Required**: All proposals require explicit approval
3. **Test-Driven**: Changes must pass full test suite
4. **Rollback Capability**: Automatic rollback on test failures
5. **Ideology Validation**: All proposals scored against core principles (min 70%)
6. **Backward Compatibility**: Breaking changes require major version bump

## Usage Example

```typescript
import { initEngine, analyzeProject } from './engine/interface/engine_main'

const config = {
  enableAI: true,
  aiProvider: 'openai',
  aiApiKey: process.env.OPENAI_API_KEY,
  performanceProfilePath: './profiles'
}

const ctx = initEngine(config)
const project = getProjectHandle('./my-uplim-project')
const report = analyzeProject(ctx, project)

console.log('Diagnostics:', report.analysis.diagnostics)
console.log('Security:', report.security.issues)
console.log('Performance:', report.performance.suggestions)
console.log('Evolution:', report.evolution.merged)
```

## Future Enhancements

- Machine learning for better proposal ranking
- Community voting system for language changes
- Automated security vulnerability database
- Cross-project analysis and best practices
- Real-time collaboration features
- Integration with CI/CD pipelines
