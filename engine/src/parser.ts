// UPLim Parser - converts source code to AST

export interface ASTNode {
  type: string
  value?: any
  children?: ASTNode[]
  location: { line: number; column: number }
}

export interface ParseResult {
  ast: ASTNode
  errors: ParseError[]
}

export interface ParseError {
  message: string
  line: number
  column: number
  severity: 'error' | 'warning'
}

export class UPLimParser {
  parse(source: string, filename: string): ParseResult {
    const errors: ParseError[] = []
    const lines = source.split('\n')
    
    // Mock AST generation with basic pattern recognition
    const ast: ASTNode = {
      type: 'Program',
      children: [],
      location: { line: 1, column: 1 }
    }

    lines.forEach((line, index) => {
      const lineNum = index + 1
      const trimmed = line.trim()

      // Detect function definitions
      if (trimmed.startsWith('func ')) {
        ast.children?.push({
          type: 'FunctionDeclaration',
          value: trimmed,
          location: { line: lineNum, column: 1 }
        })
      }

      // Detect variable declarations
      if (trimmed.startsWith('let ')) {
        ast.children?.push({
          type: 'VariableDeclaration',
          value: trimmed,
          location: { line: lineNum, column: 1 }
        })
      }

      // Detect type definitions
      if (trimmed.startsWith('type ')) {
        ast.children?.push({
          type: 'TypeDeclaration',
          value: trimmed,
          location: { line: lineNum, column: 1 }
        })
      }

      // Basic syntax errors
      if (trimmed.includes('var ')) {
        errors.push({
          message: 'Use "let" instead of "var" in UPLim',
          line: lineNum,
          column: trimmed.indexOf('var ') + 1,
          severity: 'error'
        })
      }

      if (trimmed.includes('null')) {
        errors.push({
          message: 'Use Option<T> instead of null',
          line: lineNum,
          column: trimmed.indexOf('null') + 1,
          severity: 'warning'
        })
      }
    })

    return { ast, errors }
  }
}
