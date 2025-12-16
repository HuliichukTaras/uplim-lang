// Static Analysis Module

import { ASTNode, ParseResult } from './parser'

export interface Diagnostic {
  type: 'error' | 'warning' | 'info'
  message: string
  file: string
  line: number
  column: number
  rule: string
}

export interface AnalysisResult {
  diagnostics: Diagnostic[]
  metrics: CodeMetrics
}

export interface CodeMetrics {
  totalLines: number
  codeLines: number
  commentLines: number
  functions: number
  types: number
  complexity: number
}

export class Analyzer {
  analyze(parseResult: ParseResult, source: string, filename: string): AnalysisResult {
    const diagnostics: Diagnostic[] = []
    
    // Convert parse errors to diagnostics
    parseResult.errors.forEach(error => {
      diagnostics.push({
        type: error.severity === 'error' ? 'error' : 'warning',
        message: error.message,
        file: filename,
        line: error.line,
        column: error.column,
        rule: 'syntax'
      })
    })

    // Analyze code patterns
    const lines = source.split('\n')
    
    lines.forEach((line, index) => {
      const lineNum = index + 1
      const trimmed = line.trim()

      // Check for unsafe patterns
      if (trimmed.includes('unsafe')) {
        diagnostics.push({
          type: 'warning',
          message: 'Unsafe block detected - ensure this is necessary',
          file: filename,
          line: lineNum,
          column: trimmed.indexOf('unsafe') + 1,
          rule: 'safety.unsafe-block'
        })
      }

      // Check for TODO comments
      if (trimmed.includes('TODO') || trimmed.includes('FIXME')) {
        diagnostics.push({
          type: 'info',
          message: 'TODO comment found',
          file: filename,
          line: lineNum,
          column: 1,
          rule: 'quality.todo'
        })
      }

      // Check for long lines
      if (line.length > 100) {
        diagnostics.push({
          type: 'info',
          message: 'Line exceeds 100 characters',
          file: filename,
          line: lineNum,
          column: 100,
          rule: 'style.line-length'
        })
      }
    })

    // Calculate metrics
    const metrics = this.calculateMetrics(parseResult.ast, source)

    return { diagnostics, metrics }
  }

  private calculateMetrics(ast: ASTNode, source: string): CodeMetrics {
    const lines = source.split('\n')
    const codeLines = lines.filter(l => l.trim() && !l.trim().startsWith('//')).length
    const commentLines = lines.filter(l => l.trim().startsWith('//')).length
    
    const functions = (ast as any).body?.filter((n: any) => n.type === 'FunctionDeclaration').length || 0
    const types = (ast as any).body?.filter((n: any) => n.type === 'TypeDeclaration').length || 0

    return {
      totalLines: lines.length,
      codeLines,
      commentLines,
      functions,
      types,
      complexity: Math.floor(codeLines / 10) + functions * 2
    }
  }
}
