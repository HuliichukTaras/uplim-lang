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
// import { compilerAPI, Diagnostic as CompilerDiagnostic } from '../compiler/api/compiler-api';
// import { EngineMain } from '../engine/interface/engine-main';

// Stubbing engine context for now to ensure build stability
let engineContext: any = null;

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

let engineContext: any = null;

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

  engineContext = EngineMain.init_engine(config);

  return result;
});

documents.onDidChangeContent(async (change) => {
  const textDocument = change.document;
  await validateTextDocument(textDocument);
});

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
  const text = textDocument.getText();
  const diagnostics: any[] = [];

  // Basic validation example
  if (text.indexOf('UPLim') === -1) {
    /*
    diagnostics.push({
      severity: LSPDiagnosticSeverity.Information,
      range: {
        start: textDocument.positionAt(0),
        end: textDocument.positionAt(text.length)
      },
      message: 'Welcome to UPLim!',
      source: 'uplim-lsp'
    });
    */
  }

  // TODO: Re-enable actual compiler integration once build path is set
  /*
  const parseResult = compilerAPI.parse_source(text, { enableExperimentalSyntax: true });
  // ... maps diagnostics ...
  */

  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

function convertDiagnostic(diag: CompilerDiagnostic): any {
  return {
    severity: severityMap[diag.severity],
    range: {
      start: { line: diag.location.line, character: diag.location.column },
      end: { line: diag.location.line, character: diag.location.column + 10 },
    },
    message: diag.message,
    code: diag.code,
    source: 'uplim-compiler',
  };
}

const severityMap: Record<string, any> = {
  info: LSPDiagnosticSeverity.Information,
  warning: LSPDiagnosticSeverity.Warning,
  error: LSPDiagnosticSeverity.Error,
  low: LSPDiagnosticSeverity.Information,
  medium: LSPDiagnosticSeverity.Warning,
  high: LSPDiagnosticSeverity.Error,
  critical: LSPDiagnosticSeverity.Error,
};

// Custom UPLim methods
connection.onRequest('uplim/engineReport', async (params: { uri: string }) => {
  const document = documents.get(params.uri);
  if (!document || !engineContext) return null;

  const text = document.getText();
  const parseResult = compilerAPI.parse_source(text, { enableExperimentalSyntax: true });
  
  if (!parseResult.ast) return null;

  const projectHandle = {
    root: params.uri,
    load_all_ast: () => [parseResult.ast],
    is_benchmark_enabled: () => false,
    discover_benchmarks: () => [],
  };

  return EngineMain.analyze_project(engineContext, projectHandle);
});

connection.onRequest('uplim/projectHealth', async (params: { root: string }) => {
  if (!engineContext) return { health: 'unknown' };

  const projectHandle = compilerAPI.get_project_handle(params.root);
  const report = EngineMain.analyze_project(engineContext, projectHandle);

  const errorCount = report.analysis.diagnostics.filter((d: any) => d.severity === 'error').length;
  const securityIssues = report.security.issues.filter((i: any) => i.severity === 'high' || i.severity === 'critical').length;

  let health = 'good';
  if (errorCount > 0 || securityIssues > 0) health = 'critical';
  else if (report.analysis.diagnostics.length > 5) health = 'warning';

  return { health, report };
});

documents.listen(connection);
connection.listen();
