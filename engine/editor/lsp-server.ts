// Engine Module: Language Server Protocol Implementation
// Provides IDE integration for UPLim

import { staticAnalyzer, AnalysisIssue } from '../analysis/static-analyzer';
import { syntaxRules } from '../rules/syntax-rules';

export type LSPDiagnostic = {
  range: { start: { line: number; character: number }; end: { line: number; character: number } };
  severity: 1 | 2 | 3 | 4; // Error, Warning, Information, Hint
  message: string;
  source: string;
  code?: string;
};

export type CompletionItem = {
  label: string;
  kind: number;
  detail?: string;
  documentation?: string;
  insertText?: string;
};

export type SignatureHelp = {
  signatures: Array<{
    label: string;
    documentation?: string;
    parameters: Array<{
      label: string;
      documentation?: string;
    }>;
  }>;
  activeSignature: number;
  activeParameter: number;
};

export class LSPServer {
  private documents: Map<string, string> = new Map();

  // Document Management
  openDocument(uri: string, text: string) {
    this.documents.set(uri, text);
    return this.validateDocument(uri);
  }

  updateDocument(uri: string, text: string) {
    this.documents.set(uri, text);
    return this.validateDocument(uri);
  }

  closeDocument(uri: string) {
    this.documents.delete(uri);
  }

  // Diagnostics
  validateDocument(uri: string): LSPDiagnostic[] {
    const text = this.documents.get(uri);
    if (!text) return [];

    const issues = staticAnalyzer.analyze(text);
    
    return issues.map(issue => this.issueToDiagnostic(issue));
  }

  private issueToDiagnostic(issue: AnalysisIssue): LSPDiagnostic {
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
      severity: severityMap[issue.type] as 1 | 2 | 3 | 4,
      message: issue.message,
      source: 'uplim-engine',
      code: issue.id,
    };
  }

  // Auto-completion
  provideCompletionItems(uri: string, line: number, character: number): CompletionItem[] {
    const keywords = syntaxRules.getRequiredKeywords();
    
    return keywords.map(keyword => ({
      label: keyword,
      kind: 14, // Keyword
      detail: `UPLim keyword`,
      documentation: `Built-in keyword: ${keyword}`,
      insertText: keyword,
    }));
  }

  // Signature Help
  provideSignatureHelp(uri: string, line: number, character: number): SignatureHelp | null {
    const text = this.documents.get(uri);
    if (!text) return null;

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
  provideHover(uri: string, line: number, character: number): { contents: string } | null {
    return {
      contents: 'UPLim: The Human Programming Language\nSimple to read. Safe by default. Fast everywhere.',
    };
  }

  // Formatting
  formatDocument(uri: string): { range: any; newText: string }[] {
    const text = this.documents.get(uri);
    if (!text) return [];

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

export const lspServer = new LSPServer();
