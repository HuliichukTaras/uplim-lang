import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  TextDocumentSyncKind,
  InitializeResult,
  DiagnosticSeverity as LSPDiagnosticSeverity,
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';
import { EngineMain, compilerAPI, Diagnostic as CompilerDiagnostic } from 'uplim-engine';

// Engine context
let engineContext: any = null;

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

connection.onInitialize((params: InitializeParams) => {
  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      diagnosticProvider: {
        interFileDependencies: false,
        workspaceDiagnostics: false,
      },
    },
  };

  // Initialize UPLim Engine
  const config = {
    enableAI: params.initializationOptions?.engine?.enableAI || false,
    aiProvider: params.initializationOptions?.engine?.aiProvider || 'openai',
    aiApiKey: params.initializationOptions?.engine?.apiKey || null,
    performanceProfilePath: params.initializationOptions?.engine?.profilePath || './profiles',
  };

  try {
    engineContext = EngineMain.init_engine(config);
    connection.console.log('UPLim Engine initialized successfully.');
  } catch (e) {
    connection.console.error(`Failed to initialize UPLim Engine: ${e}`);
  }

  return result;
});

documents.onDidChangeContent(async (change) => {
  const textDocument = change.document;
  await validateTextDocument(textDocument);
});

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
  const text = textDocument.getText();
  const diagnostics: any[] = [];

  try {
    // Use compilerAPI for parsing and diagnostics
    const parseResult = compilerAPI.parse_source(text, { enableExperimentalSyntax: true });
    
    if (parseResult.diagnostics.length > 0) {
      diagnostics.push(...parseResult.diagnostics.map(convertDiagnostic));
    }

    if (parseResult.ast) {
        const analysisResult = compilerAPI.analyze_ast(parseResult.ast, { enableFlowAnalysis: true });
        if (analysisResult.diagnostics.length > 0) {
            diagnostics.push(...analysisResult.diagnostics.map(convertDiagnostic));
        }
    }
  } catch (e: any) {
    connection.console.error(`Validation error: ${e.message}`);
  }

  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

function convertDiagnostic(diag: CompilerDiagnostic): any {
  return {
    severity: severityMap[diag.severity] || LSPDiagnosticSeverity.Error,
    range: {
      start: { line: Math.max(0, diag.location.line - 1), character: Math.max(0, diag.location.column) },
      end: { line: Math.max(0, diag.location.line - 1), character: Math.max(0, diag.location.column + 10) },
    },
    message: diag.message,
    code: diag.code,
    source: 'uplim',
  };
}

const severityMap: Record<string, any> = {
  info: LSPDiagnosticSeverity.Information,
  warning: LSPDiagnosticSeverity.Warning,
  error: LSPDiagnosticSeverity.Error,
};

// Custom UPLim methods can be added here
connection.onRequest('uplim/projectHealth', async (params: { root: string }) => {
    // ... implementation for project health
    return { health: 'good' }; // Stub
});

documents.listen(connection);
connection.listen();
