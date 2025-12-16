// UPLim Parser - converts source code to AST

import { Lexer, Token, TokenType } from './lexer'

export interface ASTNode {
  type: string
  location: { line: number; column: number }
}

export interface Program extends ASTNode {
  type: 'Program'
  body: ASTNode[]
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
  body: BlockStatement
}

export interface BlockStatement extends ASTNode {
  type: 'BlockStatement'
  body: ASTNode[]
}

export interface SayStatement extends ASTNode {
  type: 'SayStatement'
  argument: Expression
}

export interface IfStatement extends ASTNode {
    type: 'IfStatement'
    test: Expression
    consequent: BlockStatement
    alternate?: BlockStatement
}

export interface ExpressionStatement extends ASTNode {
  type: 'ExpressionStatement'
  expression: Expression
}

export type Expression = 
  | BinaryExpression 
  | Literal 
  | Identifier 
  | CallExpression

export interface BinaryExpression extends ASTNode {
  type: 'BinaryExpression'
  operator: string
  left: Expression
  right: Expression
}

export interface CallExpression extends ASTNode {
  type: 'CallExpression'
  callee: Identifier
  arguments: Expression[]
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
  private position: number = 0
  public errors: ParseError[] = [] // Make public for CLI access

  parse(source: string, filename: string = 'unknown'): ParseResult {
    const lexer = new Lexer(source)
    this.tokens = lexer.tokenize()
    this.position = 0
    this.errors = [] // Reset errors

    this.errors = []

    const program: Program = {
      type: 'Program',
      body: [],
      location: { line: 1, column: 1 }
    }

    while (this.current().type !== TokenType.EOF) {
      try {
        const stmt = this.parseStatement()
        if (stmt) {
          program.body.push(stmt)
        }
      } catch (e: any) {
        this.errors.push({
          message: e.message,
          line: this.current().line,
          column: this.current().column,
          severity: 'error'
        })
        this.synchronize()
      }
    }

    return { ast: program, errors: this.errors }
  }

  private parseStatement(): ASTNode | null {
    const token = this.current()

    if (token.type === TokenType.LET) {
      return this.parseVariableDeclaration()
    }
    if (token.type === TokenType.FN || token.type === TokenType.MAKE) {
        return this.parseFunctionDeclaration()
    }
    if (token.type === TokenType.SAY) {
        return this.parseSayStatement()
    }
    if (token.type === TokenType.IF) {
        return this.parseIfStatement()
    }
    if (token.type === TokenType.LBRACE) {
        return this.parseBlock()
    }

    return this.parseExpressionStatement()
  }

  private parseVariableDeclaration(): VariableDeclaration {
    const startToken = this.consume(TokenType.LET)
    const name = this.consume(TokenType.IDENTIFIER, "Expected variable name").value
    this.consume(TokenType.ASSIGN, "Expected '=' after variable name")
    const value = this.parseExpression()
    // Optional semicolon
    if (this.current().type === TokenType.SEMICOLON) {
        this.advance()
    }
    return {
      type: 'VariableDeclaration',
      name,
      value,
      location: { line: startToken.line, column: startToken.column }
    }
  }
  
  private parseFunctionDeclaration(): FunctionDeclaration {
      const startToken = this.advance() // fn or make
      const name = this.consume(TokenType.IDENTIFIER, "Expected function name").value
      
      this.consume(TokenType.LPAREN, "Expected '(' after function name")
      const params: string[] = []
      if (this.current().type !== TokenType.RPAREN) {
          do {
              params.push(this.consume(TokenType.IDENTIFIER, "Expected parameter name").value)
          } while (this.match(TokenType.COMMA))
      }
      this.consume(TokenType.RPAREN, "Expected ')' after parameters")
      
      let body: BlockStatement
      
      if (startToken.type === TokenType.MAKE) {
           this.consume(TokenType.ARROW, "Expected '=>' for make function")
           const expr = this.parseExpression()
           // Wrap expression in return statement inside block
           body = {
               type: 'BlockStatement',
               location: startToken, // approximate
               body: [{
                   type: 'ExpressionStatement', // In a real lang this might be explicit return, simplifying for now
                   expression: expr,
                   location: expr.location
               } as ASTNode] 
           }
      } else {
          body = this.parseBlock()
      }
      
      return {
          type: 'FunctionDeclaration',
          name,
          params,
          body,
          location: { line: startToken.line, column: startToken.column }
      }
  }
  
  private parseSayStatement(): SayStatement {
      const startToken = this.consume(TokenType.SAY)
      const argument = this.parseExpression()
       if (this.current().type === TokenType.SEMICOLON) {
        this.advance()
      }
      return {
          type: 'SayStatement',
          argument,
          location: { line: startToken.line, column: startToken.column }
      }
  }

  private parseIfStatement(): IfStatement {
      const startToken = this.consume(TokenType.IF)
      const test = this.parseExpression()
      const consequent = this.parseBlock()
      let alternate: BlockStatement | undefined
      
      if (this.match(TokenType.ELSE)) {
          if (this.current().type === TokenType.IF) {
              // else if - wrap in block
              alternate = {
                  type: 'BlockStatement',
                  location: this.current(),
                  body: [this.parseIfStatement()]
              }
          } else {
              alternate = this.parseBlock()
          }
      }
      
      return {
          type: 'IfStatement',
          test,
          consequent,
          alternate,
          location: { line: startToken.line, column: startToken.column }
      }
  }
  
  private parseBlock(): BlockStatement {
      const startToken = this.consume(TokenType.LBRACE, "Expected '{'")
      const body: ASTNode[] = []
      
      while (this.current().type !== TokenType.RBRACE && this.current().type !== TokenType.EOF) {
          const stmt = this.parseStatement()
          if (stmt) body.push(stmt)
      }
      
      this.consume(TokenType.RBRACE, "Expected '}'")
      return {
          type: 'BlockStatement',
          body,
          location: { line: startToken.line, column: startToken.column }
      }
  }

  private parseExpressionStatement(): ExpressionStatement {
    const expr = this.parseExpression()
    if (this.current().type === TokenType.SEMICOLON) {
        this.advance()
    }
    return {
      type: 'ExpressionStatement',
      expression: expr,
      location: expr.location
    }
  }

  private parseExpression(): Expression {
    return this.parseBinaryExpression(0)
  }
  
  private parseBinaryExpression(minPrecedence: number): Expression {
      let left = this.parsePrimary()
      
      while (true) {
          const token = this.current()
          const precedence = this.getPrecedence(token.type)
          
          if (precedence < minPrecedence) break
          
          this.advance()
          const right = this.parseBinaryExpression(precedence + 1)
          left = {
              type: 'BinaryExpression',
              operator: token.value,
              left,
              right,
              location: left.location
          }
      }
      
      return left
  }
  
  private getPrecedence(type: TokenType): number {
      switch (type) {
          case TokenType.LT:
          case TokenType.GT:
            return 1
          case TokenType.PLUS:
          case TokenType.MINUS:
            return 2
          case TokenType.MULTIPLY:
          case TokenType.DIVIDE:
            return 3
          default:
            return -1
      }
  }

  private parsePrimary(): Expression {
      const token = this.current()
      
      if (token.type === TokenType.NUMBER) {
          this.advance()
          return { type: 'Literal', value: Number(token.value), raw: token.value, location: token }
      }
      
      if (token.type === TokenType.STRING) {
          this.advance()
          return { type: 'Literal', value: token.value, raw: token.value, location: token }
      }
      
      if (token.type === TokenType.IDENTIFIER) {
          this.advance()
          // Check for call
          if (this.current().type === TokenType.LPAREN) {
             return this.finishCall({ type: 'Identifier', name: token.value, location: token })
          }
          return { type: 'Identifier', name: token.value, location: token }
      }
      
      if (token.type === TokenType.LPAREN) {
          this.advance()
          const expr = this.parseExpression()
          this.consume(TokenType.RPAREN, "Expected ')'")
          return expr
      }
      
      throw new Error(`Unexpected token: ${token.type} (${token.value})`)
  }
  
  private finishCall(callee: Identifier): CallExpression {
      this.consume(TokenType.LPAREN)
      const args: Expression[] = []
      if (this.current().type !== TokenType.RPAREN) {
          do {
              args.push(this.parseExpression())
          } while (this.match(TokenType.COMMA))
      }
      this.consume(TokenType.RPAREN)
      return {
          type: 'CallExpression',
          callee,
          arguments: args,
          location: callee.location
      }
  }

  private current(): Token {
    return this.tokens[this.position]
  }

  private advance(): Token {
    if (this.position < this.tokens.length - 1) {
       this.position++
    }
    return this.tokens[this.position - 1]
  }
  
  private consume(type: TokenType, message?: string): Token {
      if (this.current().type === type) {
          this.position++
          return this.tokens[this.position - 1]
      }
      throw new Error(message || `Expected ${type} but got ${this.current().type}`)
  }
  
  private match(type: TokenType): boolean {
      if (this.current().type === type) {
          this.advance()
          return true
      }
      return false
  }

  private synchronize() {
    this.advance()
    while (this.current().type !== TokenType.EOF) {
      if (this.current().type === TokenType.SEMICOLON) return
      
      switch (this.current().type) {
        case TokenType.LET:
        case TokenType.FN:
        case TokenType.IF:
        case TokenType.WHILE:
        case TokenType.RETURN:
          return
      }
      this.advance()
    }
  }
}
