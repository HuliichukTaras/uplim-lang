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

export type Pattern = Identifier | ObjectPattern | ArrayPattern

export interface ObjectPattern extends ASTNode {
    type: 'ObjectPattern'
    properties: { key: string, value: string }[] // value is variable name to bind to
}

export interface ArrayPattern extends ASTNode {
    type: 'ArrayPattern'
    elements: string[] // variable names
}

export interface VariableDeclaration extends ASTNode {
  type: 'VariableDeclaration'
  pattern: Pattern
  value: Expression
}

// ... existing code ...



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

export interface ReturnStatement extends ASTNode {
  type: 'ReturnStatement'
  argument?: Expression
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
  | PipelineExpression
  | RangeExpression
  | ListComprehension
  | ArrayLiteral
  | ObjectLiteral

export interface PipelineExpression extends ASTNode {
  type: 'PipelineExpression'
  left: Expression
  right: Expression
}

export interface RangeExpression extends ASTNode {
  type: 'RangeExpression'
  start: Expression
  end: Expression
  step?: Expression
}

export interface ListComprehension extends ASTNode {
  type: 'ListComprehension'
  expression: Expression
  element: string // identifier name
  source: Expression
  filter?: Expression
}

export interface ArrayLiteral extends ASTNode {
    type: 'ArrayLiteral'
    elements: Expression[]
}

export interface ObjectLiteral extends ASTNode {
    type: 'ObjectLiteral'
    properties: { key: string, value: Expression }[]
}

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
    if (token.type === TokenType.FUNC || token.type === TokenType.MAKE) {
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
    if (token.type === TokenType.RETURN) {
        return this.parseReturnStatement()
    }

    return this.parseExpressionStatement()
  }

  private parseVariableDeclaration(): VariableDeclaration {
    const startToken = this.consume(TokenType.LET)
    
    let pattern: Pattern
    
    if (this.match(TokenType.LBRACE)) {
        // Object Destructuring { a, b }
        const properties: { key: string, value: string }[] = []
        if (this.current().type !== TokenType.RBRACE) {
            do {
                const key = this.consume(TokenType.IDENTIFIER, "Expected property name").value
                // For now simple { a, b } support (shorthand)
                // If we want { a: b }, we need check for COLON
                let value = key
                if (this.match(TokenType.COLON)) {
                    value = this.consume(TokenType.IDENTIFIER, "Expected variable name").value
                }
                properties.push({ key, value })
            } while (this.match(TokenType.COMMA))
        }
        this.consume(TokenType.RBRACE, "Expected '}'")
        pattern = { type: 'ObjectPattern', properties, location: startToken }
    } else if (this.match(TokenType.LBRACKET)) {
        // Array Destructuring [ a, b ]
        const elements: string[] = []
        if (this.current().type !== TokenType.RBRACKET) {
            do {
                elements.push(this.consume(TokenType.IDENTIFIER, "Expected variable name").value)
            } while (this.match(TokenType.COMMA))
        }
        this.consume(TokenType.RBRACKET, "Expected ']'")
        pattern = { type: 'ArrayPattern', elements, location: startToken }
    } else {
        const name = this.consume(TokenType.IDENTIFIER, "Expected variable name").value
        pattern = { type: 'Identifier', name, location: startToken }
    }

    this.consume(TokenType.ASSIGN, "Expected '=' after variable declaration")
    const value = this.parseExpression()
    // Optional semicolon
    if (this.current().type === TokenType.SEMICOLON) {
        this.advance()
    }
    return {
      type: 'VariableDeclaration',
      pattern,
      value,
      location: { line: startToken.line, column: startToken.column }
    }
  }

  private parseReturnStatement(): ReturnStatement {
      const token = this.consume(TokenType.RETURN)
      let argument: Expression | undefined
      if (this.current().type !== TokenType.SEMICOLON && this.current().type !== TokenType.RBRACE) {
          argument = this.parseExpression()
      }
      if (this.match(TokenType.SEMICOLON)) {
          // consumed
      }
      return { type: 'ReturnStatement', argument, location: token }
  }


  
  private parseFunctionDeclaration(): FunctionDeclaration {
      const startToken = this.advance() // func or make
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
      
      if (this.match(TokenType.ARROW)) {
           const expr = this.parseExpression()
           // Implicit return block for short syntax
           body = {
               type: 'BlockStatement',
               location: { line: startToken.line, column: startToken.column },
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

  private getPrecedence(type: TokenType): number {
    switch (type) {
        case TokenType.PIPE_OP:
          return 1
        case TokenType.LT:
        case TokenType.GT:
          return 2
        case TokenType.PLUS:
        case TokenType.MINUS:
          return 3
        case TokenType.MULTIPLY:
        case TokenType.DIVIDE:
          return 4
        case TokenType.DOT_DOT:
          return 5
        default:
          return -1
    }
  }

  private parseBinaryExpression(minPrecedence: number): Expression {
    let left = this.parsePrimary()
    
    while (true) {
        const token = this.current()
        const precedence = this.getPrecedence(token.type)
        
        if (precedence < minPrecedence) break
        
        this.advance()
        
        // Handle Range special case for 'by'
        if (token.type === TokenType.DOT_DOT) {
             const end = this.parseBinaryExpression(precedence + 1)
             let step: Expression | undefined
             if (this.match(TokenType.BY)) {
                 step = this.parseExpression()
             }
             left = {
                 type: 'RangeExpression',
                 start: left,
                 end,
                 step,
                 location: left.location
             } as RangeExpression
             continue
        }
        
        // Handle Pipeline
        if (token.type === TokenType.PIPE_OP) {
            const right = this.parseBinaryExpression(precedence + 1)
            left = {
                type: 'PipelineExpression',
                left,
                right,
                location: left.location
            } as PipelineExpression
            continue
        }

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
    
    if (token.type === TokenType.LBRACKET) {
        return this.parseArrayOrComprehension()
    }
    
    if (token.type === TokenType.LBRACE) {
       // Object literal syntax not fully defined in v0.1 spec but good to have
       // For now, assume Block if in statement context, but here we are in Expression context.
       // However, parser calls parseBlock for LBRACE in parseStatement.
       // We need to verify if we support Object Literals in parser.
       // Simple implementation for now.
       return this.parseObjectLiteral()
    }

    if (token.type === TokenType.LPAREN) {
        this.advance()
        const expr = this.parseExpression()
        this.consume(TokenType.RPAREN, "Expected ')'")
        return expr
    }
    
    throw new Error(`Unexpected token: ${token.type} (${token.value})`)
  }

  private parseArrayOrComprehension(): Expression {
      const start = this.consume(TokenType.LBRACKET)
      // Check for empty array
      if (this.match(TokenType.RBRACKET)) {
          return { type: 'ArrayLiteral', elements: [], location: start }
      }
      
      const firstExpr = this.parseExpression()
      
      // Check for Comprehension: [ x * x | x in list ... ]
      // We look for PIPE token
      if (this.match(TokenType.PIPE)) {
           // It is a comprehension
           // Syntax: [ expression | identifier in source (, condition)? ]
           // Current we have parsed 'expression'
           const id = this.consume(TokenType.IDENTIFIER, "Expected identifier after '|' in comprehension").value
           this.consume(TokenType.IN, "Expected 'in' keyword")
           const source = this.parseExpression()
           
           let filter: Expression | undefined
           if (this.match(TokenType.COMMA)) {
               filter = this.parseExpression()
           }
           this.consume(TokenType.RBRACKET, "Expected ']'")
           
           return {
               type: 'ListComprehension',
               expression: firstExpr,
               element: id,
               source: source,
               filter,
               location: start
           }
      }
      
      // Array Literal
      const elements: Expression[] = [firstExpr]
      while (this.match(TokenType.COMMA)) {
          if (this.current().type === TokenType.RBRACKET) break; // trailing comma
          elements.push(this.parseExpression())
      }
      this.consume(TokenType.RBRACKET, "Expected ']'")
      
      return { type: 'ArrayLiteral', elements, location: start }
  }

  private parseObjectLiteral(): ObjectLiteral {
       const start = this.consume(TokenType.LBRACE)
       const properties: { key: string, value: Expression }[] = []
       
       if (this.current().type !== TokenType.RBRACE) {
           do {
               const key = this.consume(TokenType.IDENTIFIER, "Expected property name").value
               this.consume(TokenType.COLON, "Expected ':'")
               const value = this.parseExpression()
               properties.push({ key, value })
           } while (this.match(TokenType.COMMA))
       }
       
       this.consume(TokenType.RBRACE, "Expected '}'")
       return { type: 'ObjectLiteral', properties, location: start }
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
        case TokenType.FUNC:
        case TokenType.IF:
        case TokenType.WHILE:
        case TokenType.RETURN:
          return
      }
      this.advance()
    }
  }
}

