export interface LSPServerConfig {
  maxProblems: number
  ideologyThreshold: number
}

export interface LSPMessage {
  jsonrpc: string
  id?: string | number
  method?: string
  params?: any
  result?: any
  error?: { code: number; message: string; data?: any }
}

export class UPLimLSPServer {
  private config: LSPServerConfig
  private documents: Map<string, string> = new Map()
  private diagnostics: Map<string, any[]> = new Map()

  constructor(config: Partial<LSPServerConfig> = {}) {
    this.config = {
      maxProblems: config.maxProblems || 100,
      ideologyThreshold: config.ideologyThreshold || 70,
    }
  }

  // Standard LSP Methods
  initialize(params: any) {
    return {
      capabilities: {
        textDocumentSync: 1,
        completionProvider: { resolveProvider: false },
        hoverProvider: true,
        definitionProvider: true,
        referencesProvider: true,
        renameProvider: true,
        documentFormattingProvider: true,
        diagnosticProvider: { interFileDependencies: true, workspaceDiagnostics: false },
      },
    }
  }

  textDocumentDidOpen(params: any) {
    const uri = params.textDocument.uri
    const text = params.textDocument.text
    this.documents.set(uri, text)
    this.publishDiagnostics(uri, text)
  }

  textDocumentDidChange(params: any) {
    const uri = params.textDocument.uri
    const changes = params.contentChanges
    let text = this.documents.get(uri) || ""

    for (const change of changes) {
      if ("range" in change) {
        // Partial update
        const lines = text.split("\n")
        const start = change.range.start
        const end = change.range.end
        lines[start.line] =
          lines[start.line].substring(0, start.character) + change.text + lines[end.line].substring(end.character)
        text = lines.join("\n")
      } else {
        // Full document
        text = change.text
      }
    }

    this.documents.set(uri, text)
    this.publishDiagnostics(uri, text)
  }

  textDocumentDidSave(params: any) {
    const uri = params.textDocument.uri
    const text = this.documents.get(uri) || ""
    console.log(`[LSP] Document saved: ${uri}`)
  }

  textDocumentDidClose(params: any) {
    const uri = params.textDocument.uri
    this.documents.delete(uri)
    this.diagnostics.delete(uri)
  }

  // Code Intelligence Methods
  textDocumentCompletion(params: any) {
    const keywords = ["let", "make", "when", "do", "end", "say", "import", "async", "await"]
    return keywords.map((word, i) => ({
      label: word,
      kind: 14, // Keyword
      data: i,
    }))
  }

  textDocumentHover(params: any) {
    return {
      contents: "UPLim Language Server - Hover information",
    }
  }

  textDocumentDefinition(params: any) {
    return null
  }

  textDocumentReferences(params: any) {
    return []
  }

  textDocumentRename(params: any) {
    return { changes: {} }
  }

  textDocumentFormatting(params: any) {
    return []
  }

  // Custom UPLim Methods
  uplimEngineReport(params: any) {
    return {
      status: "running",
      iteration: 42,
      evolutionHistory: [],
      proposalsApproved: 5,
      proposalsRejected: 2,
    }
  }

  uplimProjectHealth(params: any) {
    return {
      health: "good",
      issues: 0,
      warnings: 2,
      ideologyAlignment: 92,
    }
  }

  uplimQuickFixes(params: any) {
    return [
      {
        title: "Add missing type annotation",
        kind: "refactor",
      },
      {
        title: "Simplify syntax",
        kind: "refactor",
      },
    ]
  }

  // Helper Methods
  private publishDiagnostics(uri: string, text: string) {
    const diagnostics = this.analyzeDiagnostics(text)
    this.diagnostics.set(uri, diagnostics)
    console.log(`[LSP] Published ${diagnostics.length} diagnostics for ${uri}`)
  }

  private analyzeDiagnostics(text: string) {
    const diags: any[] = []

    // Check for unsafe patterns
    if (text.includes("null") || text.includes("undefined")) {
      diags.push({
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } },
        severity: 1,
        message: "[UPLim] Use Option<T> instead of null/undefined",
        source: "uplim-lsp",
      })
    }

    // Check for throw statements
    if (text.includes("throw")) {
      diags.push({
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } },
        severity: 1,
        message: "[UPLim] Use Result<T,E> instead of exceptions",
        source: "uplim-lsp",
      })
    }

    // Check readability
    const lines = text.split("\n")
    lines.forEach((line, i) => {
      if (line.length > 120) {
        diags.push({
          range: { start: { line: i, character: 120 }, end: { line: i, character: line.length } },
          severity: 2,
          message: "[UPLim] Line too long (readability concern)",
          source: "uplim-lsp",
        })
      }
    })

    return diags.slice(0, this.config.maxProblems)
  }
}

export const lspServer = new UPLimLSPServer()
