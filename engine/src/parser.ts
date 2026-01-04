
import { Lexer, Token, TokenType } from './lexer'

export interface ASTNode {
  type: string
  location: { line: number; column: number }
}

export interface Program extends ASTNode {
  type: 'Program'
  body: ASTNode[]
}

export interface PrintStatement extends ASTNode {
    type: 'PrintStatement'
    expression: Expression
}

export interface VariableDeclaration extends ASTNode {
  type: 'VariableDeclaration'
  name: string
  value: Expression
}

export interface FunctionDeclaration extends ASTNode {
  type: 'FunctionDeclaration'
  name: string
  params: string[]
  body: ASTNode[]
}

export interface IfStatement extends ASTNode {
  type: 'IfStatement'
  condition: Expression
  thenBranch: ASTNode[]
  elseBranch?: ASTNode[]
}

export interface ExpressionStatement extends ASTNode {
    type: 'ExpressionStatement'
    expression: Expression
}

export interface CallExpression extends ASTNode {
    type: 'CallExpression'
    callee: string
    args: Expression[]
}

export interface BinaryExpression extends ASTNode {
    type: 'BinaryExpression'
    left: Expression
    operator: string
    right: Expression
}

export interface Literal extends ASTNode {
    type: 'Literal'
    value: any
    raw: string
}

export interface Identifier extends ASTNode {
    type: 'Identifier'
    name: string
}

export type Expression = Literal | Identifier | BinaryExpression | CallExpression

export interface ParseResult {
  ast: Program
  errors: ParseError[]
}

export interface ParseError {
  message: string
  line: number
  column: number
  severity: 'error' | 'warning'
}

export class UPLimParser {
  private tokens: Token[] = []
  private current: number = 0
  private errors: ParseError[] = []

  parse(source: string, filename: string): ParseResult {
    const lexer = new Lexer(source)
    this.tokens = lexer.tokenize()
    this.current = 0
    this.errors = []

    const program: Program = {
      type: 'Program',
      body: [],
      location: { line: 1, column: 1 }
    }

    while (!this.isAtEnd()) {
      try {
        const stmt = this.declaration()
        if (stmt) {
            program.body.push(stmt)
        }
      } catch (error) {
        this.synchronize()
      }
    }

    return { ast: program, errors: this.errors }
  }

  private declaration(): ASTNode | null {
    if (this.match(TokenType.Let)) return this.variableDeclaration()
    if (this.match(TokenType.Make)) return this.functionDeclaration()
    return this.statement()
  }

  private variableDeclaration(): VariableDeclaration {
    const name = this.consume(TokenType.Identifier, "Expect variable name.")
    this.consume(TokenType.Equals, "Expect '=' after variable name.")
    const value = this.expression()
    // No newline check yet, assuming implied or explicit
    return {
        type: 'VariableDeclaration',
        name: name.value,
        value,
        location: { line: name.line, column: name.column }
    }
  }

  private functionDeclaration(): FunctionDeclaration {
      const name = this.consume(TokenType.Identifier, "Expect function name.")
      this.consume(TokenType.LParen, "Expect '(' after function name.")
      const params: string[] = []
      if (!this.check(TokenType.RParen)) {
          do {
              params.push(this.consume(TokenType.Identifier, "Expect parameter name.").value)
          } while (this.match(TokenType.Comma))
      }
      this.consume(TokenType.RParen, "Expect ')' after parameters.")
      
      this.consume(TokenType.Arrow, "Expect '=>' or 'do' before function body.") // Simplified for one-liner
      
      // For block body check 'do' if implemented, for now supporting expression body
      const body: ASTNode[] = []
      const stmt: ExpressionStatement = {
          type: 'ExpressionStatement',
          expression: this.expression(),
          location: {line: name.line, column: name.column}
      }
      body.push(stmt)
      
      return {
          type: 'FunctionDeclaration',
          name: name.value,
          params,
          body,
          location: { line: name.line, column: name.column }
      }
  }

  private statement(): ASTNode {
    if (this.match(TokenType.When)) return this.ifStatement()
    if (this.match(TokenType.Say)) return this.printStatement()
    return this.expressionStatement()
  }

  private printStatement(): PrintStatement {
      const token = this.previous()
      const value = this.expression()
      return {
          type: 'PrintStatement',
          expression: value,
          location: { line: token.line, column: token.column }
      }
  }

  private ifStatement(): IfStatement {
      const token = this.previous()
      const condition = this.expression()
      this.consume(TokenType.Do, "Expect 'do' after condition.")
      
      const thenBranch: ASTNode[] = []
      while (!this.check(TokenType.Else) && !this.check(TokenType.EOF)) { 
          const stmt = this.declaration()
           if (stmt) thenBranch.push(stmt)
      }

      let elseBranch: ASTNode[] | undefined = undefined
      if (this.match(TokenType.Else)) {
          elseBranch = []
          while (!this.check(TokenType.EOF)) { // Simplistic block end
             // If we hit 'when', 'make', etc inside else, good. 
             // But we need a delimiter. 
             // UPLim syntax 'when ... do ...' likely implies end? Or indented?
             // Since "Simple like Python", maybe indent based? 
             // For now, let's assume 'else' block goes until explicit End or EOF or next declaration at same level?
             // The example doesn't show 'end'. 
             // "when x > 5 do ... else ..."
             // Assuming single statement or block until next keyword?
             // Let's assume it consumes until EOF for this simple test case, OR we implement indentation detection Lexer later.
             // For now, let's consume ONE statement if no indentation logic.
             // OR effectively consume until EOF or next recognizable top-level keyword if we were deeper.
             const stmt = this.declaration()
             if (stmt) elseBranch.push(stmt)
             if (this.isAtEnd()) break
          }
      }

      return {
          type: 'IfStatement',
          condition,
          thenBranch,
          elseBranch,
          location: { line: token.line, column: token.column }
      }
  }

  private expressionStatement(): ExpressionStatement {
      const expr = this.expression()
      return {
          type: 'ExpressionStatement',
          expression: expr,
          location: expr.location
      }
  }

  private expression(): Expression {
      return this.equality()
  }

  private equality(): Expression {
      let expr = this.comparison()
      while (this.match(TokenType.Equals)) { // equality operator
          const operator = this.previous().value
          const right = this.comparison()
          expr = {
              type: 'BinaryExpression',
              left: expr,
              operator,
              right,
              location: expr.location
          } as BinaryExpression
      }
      return expr
  }

  private comparison(): Expression {
      let expr = this.term()
      while (this.match(TokenType.GreaterThan, TokenType.LessThan)) {
          const operator = this.previous().value
          const right = this.term()
          expr = {
              type: 'BinaryExpression',
              left: expr,
              operator,
              right,
              location: expr.location
          } as BinaryExpression
      }
      return expr
  }

  private term(): Expression {
      let expr = this.factor()
      while (this.match(TokenType.Plus, TokenType.Minus)) {
          const operator = this.previous().value
          const right = this.factor()
          expr = {
              type: 'BinaryExpression',
              left: expr,
              operator,
              right,
              location: expr.location
          } as BinaryExpression
      }
      return expr
  }

  private factor(): Expression {
      let expr = this.unary()
      while (this.match(TokenType.Multiply, TokenType.Divide)) {
          const operator = this.previous().value
          const right = this.unary()
          expr = {
              type: 'BinaryExpression',
              left: expr,
              operator,
              right,
              location: expr.location
          } as BinaryExpression
      }
      return expr
  }

  private unary(): Expression {
      return this.primary()
  }

  private primary(): Expression {
      if (this.match(TokenType.False)) return { type: 'Literal', value: false, raw: 'false', location: this.previousPos() }
      if (this.match(TokenType.True)) return { type: 'Literal', value: true, raw: 'true', location: this.previousPos() }
      if (this.match(TokenType.Null)) return { type: 'Literal', value: null, raw: 'null', location: this.previousPos() }

      if (this.match(TokenType.Number)) {
          return { type: 'Literal', value: parseFloat(this.previous().value), raw: this.previous().value, location: this.previousPos() }
      }
      if (this.match(TokenType.String)) {
          return { type: 'Literal', value: this.previous().value, raw: this.previous().value, location: this.previousPos() }
      }
      if (this.match(TokenType.Identifier)) {
          const name = this.previous()
          if (this.match(TokenType.LParen)) {
              return this.finishCall(name)
          }
          return { type: 'Identifier', name: name.value, location: { line: name.line, column: name.column } }
      }
      
      if (this.match(TokenType.LParen)) {
          const expr = this.expression()
          this.consume(TokenType.RParen, "Expect ')' after expression.")
          return expr
      }

      throw this.error(this.peek(), "Expect expression.")
  }

  private finishCall(callee: Token): CallExpression {
      const args: Expression[] = []
      if (!this.check(TokenType.RParen)) {
          do {
              args.push(this.expression())
          } while (this.match(TokenType.Comma))
      }
      const paren = this.consume(TokenType.RParen, "Expect ')' after arguments.")
      
      return {
          type: 'CallExpression',
          callee: callee.value,
          args,
          location: { line: callee.line, column: callee.column }
      }
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance()
        return true
      }
    }
    return false
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false
    return this.peek().type === type
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++
    return this.previous()
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF
  }

  private peek(): Token {
    return this.tokens[this.current]
  }

  private previous(): Token {
    return this.tokens[this.current - 1]
  }

  private previousPos() {
      const p = this.previous()
      return { line: p.line, column: p.column }
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance()
    throw this.error(this.peek(), message)
  }

  private error(token: Token, message: string): any {
    this.errors.push({
        message,
        line: token.line,
        column: token.column,
        severity: 'error'
    })
    return new Error(message)
  }

  private synchronize() {
    this.advance()
    while (!this.isAtEnd()) {
      // if (this.previous().type == TokenType.Semicolon) return;
      switch (this.peek().type) {
        case TokenType.Make:
        case TokenType.Let:
        case TokenType.When:
        case TokenType.Return:
          return
      }
      this.advance()
    }
  }
}
