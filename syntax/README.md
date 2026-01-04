# UPLim Syntax Highlighting

This directory contains syntax highlighting definitions for UPLim across multiple platforms.

## VS Code Extension

Location: `syntax/vscode/`

Files:
- `package.json` - Extension manifest
- `language-configuration.json` - Editor configuration
- `syntaxes/UPLim.tmLanguage.json` - TextMate grammar

To install:
1. Copy the `vscode` folder to `~/.vscode/extensions/uplim-language-support-1.0.0/`
2. Reload VS Code

## Web Integration

### Monaco Editor

Import and register the language:

\`\`\`typescript
import { registerUPLimLanguage } from '@/lib/monaco-uplim';

// After Monaco loads
registerUPLimLanguage();
\`\`\`

### Highlight.js

\`\`\`javascript
import uplim from '@/syntax/highlightjs/uplim';
hljs.registerLanguage('upl', uplim);
\`\`\`

### Prism.js

\`\`\`html
<script src="/syntax/prism/prism-uplim.js"></script>
\`\`\`

## Syntax Elements

### Keywords
module, import, export, type, fn, let, const, var, async, await, return, if, else, match, for, while, loop, break, continue, true, false, null, use, from, implements, extends, trait, interface, yield, struct, enum, public, private, protected, static, inline, external

### Types
Int, Float, String, Bool, Any, List, Map, Path, Result, Option, Id

### Operators
=, ==, !=, <, >, <=, >=, +, -, *, /, %, &&, ||, !, ?, ??, ::, :, ->

### Comments
Single-line: `# comment`

### Strings
- Double quoted: `"string"`
- Single quoted: `'string'`
- Multiline: `"""multiline"""`
