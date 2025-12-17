
// Static Analysis Module

import { ASTNode, ParseResult } from './parser'
import { UPLIM_RULES } from './rules'

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
      const context = { path: filename }

      // Apply Registered Rules
      UPLIM_RULES.forEach(rule => {
          if (rule.check(line, context)) {
              diagnostics.push({
                  type: rule.severity === 'info' ? 'info' : rule.severity === 'warning' ? 'warning' : 'error',
                  message: rule.message,
                  file: filename,
                  line: lineNum,
                  column: 1,
                  rule: rule.id
              })
          }
      })
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
