"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const uplim_engine_1 = require("uplim-engine");
// Engine context
let engineContext = null;
const connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all);
const documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
connection.onInitialize((params) => {
    const result = {
        capabilities: {
            textDocumentSync: node_1.TextDocumentSyncKind.Incremental,
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
        engineContext = uplim_engine_1.EngineMain.init_engine(config);
        connection.console.log('UPLim Engine initialized successfully.');
    }
    catch (e) {
        connection.console.error(`Failed to initialize UPLim Engine: ${e}`);
    }
    return result;
});
documents.onDidChangeContent(async (change) => {
    const textDocument = change.document;
    await validateTextDocument(textDocument);
});
async function validateTextDocument(textDocument) {
    const text = textDocument.getText();
    const diagnostics = [];
    try {
        // Use compilerAPI for parsing and diagnostics
        const parseResult = uplim_engine_1.compilerAPI.parse_source(text, { enableExperimentalSyntax: true });
        if (parseResult.diagnostics.length > 0) {
            diagnostics.push(...parseResult.diagnostics.map(convertDiagnostic));
        }
        if (parseResult.ast) {
            const analysisResult = uplim_engine_1.compilerAPI.analyze_ast(parseResult.ast, { enableFlowAnalysis: true });
            if (analysisResult.diagnostics.length > 0) {
                diagnostics.push(...analysisResult.diagnostics.map(convertDiagnostic));
            }
        }
    }
    catch (e) {
        connection.console.error(`Validation error: ${e.message}`);
    }
    connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}
function convertDiagnostic(diag) {
    return {
        severity: severityMap[diag.severity] || node_1.DiagnosticSeverity.Error,
        range: {
            start: { line: Math.max(0, diag.location.line - 1), character: Math.max(0, diag.location.column) },
            end: { line: Math.max(0, diag.location.line - 1), character: Math.max(0, diag.location.column + 10) },
        },
        message: diag.message,
        code: diag.code,
        source: 'uplim',
    };
}
const severityMap = {
    info: node_1.DiagnosticSeverity.Information,
    warning: node_1.DiagnosticSeverity.Warning,
    error: node_1.DiagnosticSeverity.Error,
};
// Custom UPLim methods can be added here
connection.onRequest('uplim/projectHealth', async (params) => {
    // ... implementation for project health
    return { health: 'good' }; // Stub
});
documents.listen(connection);
connection.listen();
//# sourceMappingURL=server.js.map