# UPLim Engine

Fully functional analysis engine for the UPLim programming language.

## Installation

\`\`\`bash
cd engine
npm install
npm run build
\`\`\`

## Usage

### Analyze a project

\`\`\`bash
npx tsx src/cli.ts analyze .
\`\`\`

### Analyze a specific file

\`\`\`bash
npx tsx src/cli.ts analyze ../examples/hello.upl
\`\`\`

### With AI analysis

\`\`\`bash
npx tsx src/cli.ts analyze . --ai
\`\`\`

## What it does

1. Finds all `.upl` files in the target directory
2. Parses each file into an AST
3. Runs static analysis (style, safety, performance)
4. Performs security scanning
5. Calculates code metrics
6. Generates comprehensive report
7. Saves results to `.uplim/reports/`

## Example Output

\`\`\`
============================================================
UPLim Engine - Analysis Report
============================================================

[Engine] Analyzing: .
[Engine] Found 3 .upl files
[Engine] Processing: ./src/main.upl
[Engine] Processing: ./src/utils.upl
[Engine] Processing: ./tests/test.upl
[Engine] Report saved: .uplim/reports/report-2024-01-15.json

============================================================
SUMMARY
============================================================
Files analyzed:     3
Total diagnostics:  5
  - Errors:         1
  - Warnings:       3
Security score:     95/100
Avg complexity:     12.3

DIAGNOSTICS:
  ./src/main.upl:
    ✗ Line 10: Use "let" instead of "var" [syntax]
    ⚠ Line 25: Use Option<T> instead of null [safety.no-null]

SECURITY ISSUES:
  [HIGH] Raw pointer usage detected
    File: ./src/utils.upl:42
    Fix: Use safe references or Box<T> instead

============================================================
Report saved to .uplim/reports/
============================================================
\`\`\`

## Modules

- `parser.ts` - Converts source code to AST
- `analysis.ts` - Static analysis and metrics
- `security.ts` - Security vulnerability scanning
- `storage.ts` - Report persistence
- `rules.ts` - Language rules registry
- `ai.ts` - AI-powered suggestions
- `engine.ts` - Orchestrates all modules
- `cli.ts` - Command-line interface

## Reports

All reports are saved as JSON in `.uplim/reports/`:
- `latest.json` - Most recent analysis
- `report-{timestamp}.json` - Historical reports

Reports include:
- Per-file diagnostics and metrics
- Security issues with recommendations
- Project-wide summary statistics
- Optional AI-generated insights
