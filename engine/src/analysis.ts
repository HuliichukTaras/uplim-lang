
import { ASTNode, ParseResult, Program, FunctionDeclaration, IfStatement, VariableDeclaration, BinaryExpression, CallExpression, PrintStatement } from './parser'

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
  private diagnostics: Diagnostic[] = []
  private filename: string = ''

  analyze(parseResult: ParseResult, source: string, filename: string): AnalysisResult {
    this.diagnostics = []
    this.filename = filename
    
    // Propagate parse errors
    parseResult.errors.forEach(error => {
      this.report({
         type: error.severity === 'error' ? 'error' : 'warning',
         message: error.message,
         line: error.line,
         column: error.column,
         rule: 'syntax'
      })
    })

    // Analyze AST
    if (parseResult.ast) {
        this.visit(parseResult.ast)
    }

    const metrics = this.calculateMetrics(parseResult.ast, source)
    return { diagnostics: this.diagnostics, metrics }
  }

  private visit(node: ASTNode) {
      switch (node.type) {
          case 'Program':
              (node as Program).body.forEach(n => this.visit(n))
              break
          case 'FunctionDeclaration':
              this.visitFunction(node as FunctionDeclaration)
              break
          case 'IfStatement':
              this.visitIf(node as IfStatement)
              break
          case 'VariableDeclaration':
              this.visitVariable(node as VariableDeclaration)
              break
          case 'PrintStatement':
              this.visit( (node as PrintStatement).expression )
              break
          // Expressions usually don't have block children in this simple parser yet, but we could traverse
      }
  }

  private visitFunction(node: FunctionDeclaration) {
      if (node.name.length < 2) {
          this.report({
              type: 'warning',
              message: `Function name '${node.name}' is too short`,
              line: node.location.line,
              column: node.location.column,
              rule: 'naming'
          })
      }
      
      // Check parameters
      const uniqueParams = new Set(node.params)
      if (uniqueParams.size !== node.params.length) {
          this.report({
              type: 'error',
              message: 'Duplicate parameter names',
              line: node.location.line,
              column: node.location.column,
              rule: 'naming'
          })
      }

      node.body.forEach(n => this.visit(n))
  }

  private visitIf(node: IfStatement) {
      node.thenBranch.forEach(n => this.visit(n))
      if (node.elseBranch) {
          node.elseBranch.forEach(n => this.visit(n))
      }
  }

  private visitVariable(node: VariableDeclaration) {
      // Basic check
      if (node.name === 'null') {
           this.report({
              type: 'error',
              message: 'Cannot name variable "null"',
              line: node.location.line,
              column: node.location.column,
              rule: 'syntax'
          })
      }
  }

  private report(diagnostic: Omit<Diagnostic, 'file'>) {
      this.diagnostics.push({ ...diagnostic, file: this.filename })
  }

  private calculateMetrics(ast: Program, source: string): CodeMetrics {
    const lines = source.split('\n')
    const codeLines = lines.filter(l => l.trim() && !l.trim().startsWith('//')).length
    const commentLines = lines.filter(l => l.trim().startsWith('//')).length
    
    let functions = 0
    let types = 0
    
    // Simple top-level count
    ast.body.forEach(node => {
        if (node.type === 'FunctionDeclaration') functions++
        if (node.type === 'TypeDeclaration') types++
    })

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
