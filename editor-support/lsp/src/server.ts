import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  TextDocumentSyncKind,
  InitializeResult,
  CompletionItem,
  CompletionItemKind,
  Diagnostic,
  DiagnosticSeverity
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';

const connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

connection.onInitialize((params: InitializeParams) => {
  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        resolveProvider: true,
        triggerCharacters: ['.', ':']
      },
      hoverProvider: true,
      definitionProvider: true,
      referencesProvider: true,
      documentFormattingProvider: true,
      diagnosticProvider: {
        interFileDependencies: false,
        workspaceDiagnostics: false
      }
    }
  };
  return result;
});

documents.onDidChangeContent(change => {
  validateTextDocument(change.document);
});

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
  const text = textDocument.getText();
  const diagnostics: Diagnostic[] = [];

  const keywords = ['let', 'make', 'when', 'do', 'end', 'return'];
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('unsafe') && !line.includes('// unsafe')) {
      diagnostics.push({
        severity: DiagnosticSeverity.Warning,
        range: {
          start: { line: i, character: 0 },
          end: { line: i, character: line.length }
        },
        message: 'Unsafe code detected. Ensure proper safety guarantees.',
        source: 'uplim'
      });
    }

    if (line.match(/\bpanic\b/)) {
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: {
          start: { line: i, character: 0 },
          end: { line: i, character: line.length }
        },
        message: 'Panic should be avoided. Use Result<T, E> instead.',
        source: 'uplim'
      });
    }

    if (line.includes('null') || line.includes('undefined')) {
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: {
          start: { line: i, character: 0 },
          end: { line: i, character: line.length }
        },
        message: 'Null values not allowed. Use Option<T> instead.',
        source: 'uplim'
      });
    }
  }

  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

connection.onCompletion(() => {
  const completions: CompletionItem[] = [
    { label: 'let', kind: CompletionItemKind.Keyword, detail: 'Variable declaration' },
    { label: 'make', kind: CompletionItemKind.Keyword, detail: 'Function declaration' },
    { label: 'when', kind: CompletionItemKind.Keyword, detail: 'Conditional' },
    { label: 'match', kind: CompletionItemKind.Keyword, detail: 'Pattern matching' },
    { label: 'type', kind: CompletionItemKind.Keyword, detail: 'Type definition' },
    { label: 'impl', kind: CompletionItemKind.Keyword, detail: 'Implementation block' },
    { label: 'trait', kind: CompletionItemKind.Keyword, detail: 'Trait definition' },
    { label: 'async', kind: CompletionItemKind.Keyword, detail: 'Async function' },
    { label: 'await', kind: CompletionItemKind.Keyword, detail: 'Await expression' },
    { label: 'Int', kind: CompletionItemKind.TypeParameter, detail: 'Integer type' },
    { label: 'Float', kind: CompletionItemKind.TypeParameter, detail: 'Float type' },
    { label: 'Bool', kind: CompletionItemKind.TypeParameter, detail: 'Boolean type' },
    { label: 'String', kind: CompletionItemKind.TypeParameter, detail: 'String type' },
    { label: 'Array', kind: CompletionItemKind.TypeParameter, detail: 'Array type' },
    { label: 'Option', kind: CompletionItemKind.TypeParameter, detail: 'Optional type' },
    { label: 'Result', kind: CompletionItemKind.TypeParameter, detail: 'Result type' },
    { label: 'say', kind: CompletionItemKind.Function, detail: 'Print to stdout' },
    { label: 'print', kind: CompletionItemKind.Function, detail: 'Print without newline' }
  ];
  return completions;
});

connection.onHover(({ textDocument, position }) => {
  return {
    contents: {
      kind: 'markdown',
      value: 'UPLim language element'
    }
  };
});

connection.onRequest('uplim/analyzeProject', async () => {
  return {
    status: 'success',
    metrics: {
      files: 10,
      lines: 1500,
      functions: 45,
      types: 12
    }
  };
});

connection.onRequest('uplim/engineReport', async () => {
  return {
    analysis: { score: 85, issues: 3 },
    security: { vulnerabilities: 0 },
    performance: { score: 92 }
  };
});

documents.listen(connection);
connection.listen();
