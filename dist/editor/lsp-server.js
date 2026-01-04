"use strict";
// Engine Module: Language Server Protocol Implementation
// Provides IDE integration for UPLim
Object.defineProperty(exports, "__esModule", { value: true });
exports.lspServer = exports.LSPServer = void 0;
const static_analyzer_1 = require("../analysis/static-analyzer");
const syntax_rules_1 = require("../rules/syntax-rules");
class LSPServer {
    documents = new Map();
    // Document Management
    openDocument(uri, text) {
        this.documents.set(uri, text);
        return this.validateDocument(uri);
    }
    updateDocument(uri, text) {
        this.documents.set(uri, text);
        return this.validateDocument(uri);
    }
    closeDocument(uri) {
        this.documents.delete(uri);
    }
    // Diagnostics
    validateDocument(uri) {
        const text = this.documents.get(uri);
        if (!text)
            return [];
        const issues = static_analyzer_1.staticAnalyzer.analyze(text);
        return issues.map(issue => this.issueToDiagnostic(issue));
    }
    issueToDiagnostic(issue) {
        const severityMap = {
            error: 1,
            warning: 2,
            info: 3,
            suggestion: 4,
        };
        return {
            range: {
                start: { line: issue.location.line, character: issue.location.column },
                end: { line: issue.location.line, character: issue.location.column + 10 },
            },
            severity: severityMap[issue.type],
            message: issue.message,
            source: 'uplim-engine',
            code: issue.id,
        };
    }
    // Auto-completion
    provideCompletionItems(uri, line, character) {
        const keywords = syntax_rules_1.syntaxRules.getRequiredKeywords();
        return keywords.map(keyword => ({
            label: keyword,
            kind: 14, // Keyword
            detail: `UPLim keyword`,
            documentation: `Built-in keyword: ${keyword}`,
            insertText: keyword,
        }));
    }
    // Signature Help
    provideSignatureHelp(uri, line, character) {
        const text = this.documents.get(uri);
        if (!text)
            return null;
        // Example: show signature for 'make' function definition
        return {
            signatures: [
                {
                    label: 'make functionName(param1, param2) do',
                    documentation: 'Define a new function',
                    parameters: [
                        { label: 'functionName', documentation: 'Name of the function' },
                        { label: 'param1, param2', documentation: 'Function parameters' },
                    ],
                },
            ],
            activeSignature: 0,
            activeParameter: 0,
        };
    }
    // Hover Information
    provideHover(uri, line, character) {
        return {
            contents: 'UPLim: The Human Programming Language\nSimple to read. Safe by default. Fast everywhere.',
        };
    }
    // Formatting
    formatDocument(uri) {
        const text = this.documents.get(uri);
        if (!text)
            return [];
        // Basic formatting: normalize whitespace
        const formatted = text
            .split('\n')
            .map(line => line.trim())
            .join('\n');
        return [
            {
                range: {
                    start: { line: 0, character: 0 },
                    end: { line: text.split('\n').length, character: 0 },
                },
                newText: formatted,
            },
        ];
    }
}
exports.LSPServer = LSPServer;
exports.lspServer = new LSPServer();
