
import { ASTNode, Program, VariableDeclaration, FunctionDeclaration, IfStatement, PrintStatement, Expression, BinaryExpression, CallExpression, Literal, Identifier } from './parser'

export class Interpreter {
  private environment: Map<string, any> = new Map()
  private output: string[] = []

  interpret(ast: Program): string {
    this.output = []
    this.environment.clear()
    
    // Default environment (optional built-ins)
    this.environment.set("PI", 3.14159)

    for (const stmt of ast.body) {
      this.execute(stmt)
    }

    return this.output.join('\n')
  }

  private execute(stmt: ASTNode) {
    switch (stmt.type) {
      case 'VariableDeclaration':
        this.visitVariableDeclaration(stmt as VariableDeclaration)
        break
      case 'PrintStatement':
        this.visitPrintStatement(stmt as PrintStatement)
        break
      case 'IfStatement':
        this.visitIfStatement(stmt as IfStatement)
        break
      case 'FunctionDeclaration':
        // Store function definition in environment? 
        // For now, ignoring or basic storage.
        // Needs "Callable" type wrapper.
        // Skip for MVP unless needed.
        break
      case 'ExpressionStatement':
        this.evaluate((stmt as any).expression)
        break
    }
  }

  private visitVariableDeclaration(stmt: VariableDeclaration) {
    const value = this.evaluate(stmt.value)
    this.environment.set(stmt.name, value)
  }

  private visitPrintStatement(stmt: PrintStatement) {
    const value = this.evaluate(stmt.expression)
    this.output.push(String(value))
  }

  private visitIfStatement(stmt: IfStatement) {
    const condition = this.evaluate(stmt.condition)
    if (this.isTruthy(condition)) {
      for (const s of stmt.thenBranch) {
        this.execute(s)
      }
    } else if (stmt.elseBranch) {
      for (const s of stmt.elseBranch) {
        this.execute(s)
      }
    }
  }

  private evaluate(expr: Expression): any {
    switch (expr.type) {
      case 'Literal':
        return (expr as Literal).value
      case 'Identifier':
        return this.lookupVariable((expr as Identifier).name)
      case 'BinaryExpression':
        return this.visitBinary(expr as BinaryExpression)
      case 'CallExpression':
        // Implement call if needed
        return null 
      default:
        return null
    }
  }

  private lookupVariable(name: string): any {
    if (this.environment.has(name)) {
      return this.environment.get(name)
    }
    throw new Error(`Undefined variable '${name}'`)
  }

  private visitBinary(expr: BinaryExpression): any {
    const left = this.evaluate(expr.left)
    const right = this.evaluate(expr.right)

    switch (expr.operator) {
      case '+': return left + right
      case '-': return left - right
      case '*': return left * right
      case '/': return left / right
      case '>': return left > right
      case '<': return left < right
      case '==': return left === right
      case '!=': return left !== right
      case '>=': return left >= right
      case '<=': return left <= right
      default: return null
    }
  }

  private isTruthy(value: any): boolean {
    if (value === null) return false
    if (value === false) return false
    if (value === 0) return false
    return true
  }
}
