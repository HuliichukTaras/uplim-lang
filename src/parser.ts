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

export interface TypeAnnotation extends ASTNode {
    type: 'TypeAnnotation'
    name: string
    isGeneric?: boolean
    params?: TypeAnnotation[] // For Result[T, E] or Map[K, V]
    isArray?: boolean // For T[]
}

export interface VariableDeclaration extends ASTNode {
  type: 'VariableDeclaration'
  kind: 'let' | 'var' | 'const'
  pattern: Pattern
  typeAnnotation?: TypeAnnotation
  value: Expression
}

export interface StructDeclaration extends ASTNode {
    type: 'StructDeclaration'
    name: string
    fields: { name: string, typeAnnotation: TypeAnnotation }[]
}

export interface EnumDeclaration extends ASTNode {
    type: 'EnumDeclaration'
    name: string
    members: string[]
}

export interface ModelDeclaration extends ASTNode {
    type: 'ModelDeclaration'
    name: string
    properties: { key: string, value: Literal }[]
}



// ... existing code ...



export interface FunctionDeclaration extends ASTNode {
  type: 'FunctionDeclaration'
  name: string
  params: { name: string, typeAnnotation?: TypeAnnotation }[]
  returnType?: TypeAnnotation
  body: BlockStatement
  isPub?: boolean
  isAsync?: boolean
}

export interface FunctionExpression extends ASTNode {
  type: 'FunctionExpression'
  name?: string
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
    alternate?: BlockStatement | IfStatement
}

export interface ReturnStatement extends ASTNode {
  type: 'ReturnStatement'
  argument?: Expression
}


export interface ImportDeclaration extends ASTNode {
    type: 'ImportDeclaration'
    source: string
}

// ExportDeclaration removed for v0.1

export interface AwaitExpression extends ASTNode {
    type: 'AwaitExpression'
    argument: Expression
}

export interface ExpressionStatement extends ASTNode {
  type: 'ExpressionStatement'
  expression: Expression
}

export type Expression = 
  | BinaryExpression 
  | Literal 
  | Identifier
  | UnaryExpression
  | CallExpression
  | MemberExpression
  | AssignmentExpression
  | PipelineExpression
  | RangeExpression
  | ListComprehension
  | ArrayLiteral
  | ObjectLiteral
  | FunctionExpression
  | AwaitExpression

export interface UnaryExpression extends ASTNode {
    type: 'UnaryExpression'
    operator: string
    argument: Expression
}

export interface WhileStatement extends ASTNode {
    type: 'WhileStatement'
    test: Expression
    body: BlockStatement
}

export type Statement = 
    | VariableDeclaration
    | FunctionDeclaration
    | IfStatement
    | ReturnStatement
    | BlockStatement
    | ExpressionStatement
    | StructDeclaration
    | EnumDeclaration
    | ModelDeclaration
    | ImportDeclaration
    | SayStatement
    | WhileStatement

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
  callee: Expression
  arguments: Expression[]
}

export interface MemberExpression extends ASTNode {
  type: 'MemberExpression'
  object: Expression
  property: Identifier
}

export interface AssignmentExpression extends ASTNode {
  type: 'AssignmentExpression'
  left: Expression
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

export class Parser {

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

    if (token.type === TokenType.LET || token.type === TokenType.VAR) {
      return this.parseVariableDeclaration()
    }
    if (token.type === TokenType.FUNC || token.type === TokenType.MAKE ||
        token.type === TokenType.PUB || token.type === TokenType.ASYNC) {
        return this.parseFunctionDeclaration()
    }
    if (token.type === TokenType.STRUCT) return this.parseStructDeclaration()
    if (token.type === TokenType.ENUM) return this.parseEnumDeclaration()
    if (token.type === TokenType.MODEL) return this.parseModelDeclaration()
    if (token.type === TokenType.IMPORT) return this.parseImportDeclaration()
    // if (token.type === TokenType.EXPORT) return this.parseExportDeclaration()

    if (token.type === TokenType.SAY) {
        return this.parseSayStatement()
    }
    if (token.type === TokenType.IF || token.type === TokenType.WHEN) {
        return this.parseIfStatement()
    }
    if (token.type === TokenType.WHILE) {
        return this.parseWhileStatement()
    }
    if (token.type === TokenType.LBRACE) {
        return this.parseBlock()
    }
    if (token.type === TokenType.RETURN) {
        return this.parseReturnStatement()
    }

    // Default to Expression Statement
    return this.parseExpressionStatement()
  }

  private parseVariableDeclaration(): VariableDeclaration {
    const startToken = this.current()
    if (startToken.type === TokenType.LET) this.advance()
    else if (startToken.type === TokenType.VAR) this.advance()
    else throw new Error("Expected let or var")
    
    // Pattern parsing (simplified) ...
    // Note: Assuming Identifier pattern for now for strict typing
    // If strict typing, do we support destructuring with types?
    // "let {x}: {x:Int} = ..." - complex.
    // Spec shows: let x: Int = 10
    
    let pattern: Pattern
    const nameToken = this.consume(TokenType.IDENTIFIER, "Expected variable name")
    pattern = { type: 'Identifier', name: nameToken.value, location: nameToken }
    
    // Optional Type Annotation
    let typeAnnotation: TypeAnnotation | undefined
    if (this.match(TokenType.COLON)) {
        typeAnnotation = this.parseTypeAnnotation()
    }

    this.consume(TokenType.ASSIGN, "Expected '=' after variable declaration")
    const value = this.parseExpression()
    
    if (this.current().type === TokenType.SEMICOLON) this.advance()

    return {
      type: 'VariableDeclaration',
      kind: startToken.type === TokenType.VAR ? 'var' : 'let',
      pattern,
      typeAnnotation,
      value,
      location: { line: startToken.line, column: startToken.column }
    }
  }

  private parseTypeAnnotation(): TypeAnnotation {
      // Simple type: Int
      // Array: [Int]
      // Map: Map[String, Any]
      // Result: Result[T, E]
      
      const start = this.current()
      
      if (this.match(TokenType.LBRACKET)) {
          // [Int] syntax from spec -> Array
          const inner = this.parseTypeAnnotation()
          this.consume(TokenType.RBRACKET)
          return {
              type: 'TypeAnnotation',
              name: inner.name, // Simplified 'Array<T>' or just mark as array
              params: [inner],
              isArray: true,
              location: start
          }
      }
      
      // Basic type identifier
      let name = ''
      if (
          this.current().type === TokenType.TYPE_INT ||
          this.current().type === TokenType.TYPE_FLOAT ||
          this.current().type === TokenType.TYPE_STRING ||
          this.current().type === TokenType.TYPE_BOOL ||
          this.current().type === TokenType.TYPE_VOID ||
          this.current().type === TokenType.TYPE_ANY
      ) {
          name = this.advance().value
      } else {
          name = this.consume(TokenType.IDENTIFIER).value
      }
      
      let params: TypeAnnotation[] = []
      
      // Check for generics [T, E]
      // Note: Spec uses Map[String, Any] -> Square Brackets for generics?
      // Spec: Result[T, E]
      if (this.match(TokenType.LBRACKET)) {
          do {
              params.push(this.parseTypeAnnotation())
          } while (this.match(TokenType.COMMA))
          this.consume(TokenType.RBRACKET)
      }
      
      return {
          type: 'TypeAnnotation',
          name,
          params,
          isArray: false,
          location: start
      }
  }

  private parseStructDeclaration(): StructDeclaration {
      const start = this.consume(TokenType.STRUCT)
      const name = this.consume(TokenType.IDENTIFIER).value
      this.consume(TokenType.LBRACE)
      
      const fields: { name: string, typeAnnotation: TypeAnnotation }[] = []
      
      while (this.current().type !== TokenType.RBRACE && this.current().type !== TokenType.EOF) {
          const fieldName = this.consume(TokenType.IDENTIFIER).value
          this.consume(TokenType.COLON)
          const typeAnn = this.parseTypeAnnotation()
          fields.push({ name: fieldName, typeAnnotation: typeAnn })
          
          // Optional comma or newline handling implicitly via loop
          if (this.current().type === TokenType.COMMA) this.advance()
      }
      
      this.consume(TokenType.RBRACE)
      return { type: 'StructDeclaration', name, fields, location: start }
  }

  private parseEnumDeclaration(): EnumDeclaration {
      const start = this.consume(TokenType.ENUM)
      const name = this.consume(TokenType.IDENTIFIER).value
      this.consume(TokenType.LBRACE)
      
      const members: string[] = []
      while (this.current().type !== TokenType.RBRACE) {
          members.push(this.consume(TokenType.IDENTIFIER).value)
          if (this.current().type === TokenType.COMMA) this.advance()
      }
      
      this.consume(TokenType.RBRACE)
      return { type: 'EnumDeclaration', name, members, location: start }
  }

  private parseModelDeclaration(): ModelDeclaration {
      const start = this.consume(TokenType.MODEL)
      const name = this.consume(TokenType.IDENTIFIER).value
      this.consume(TokenType.LBRACE)
      
      const properties: { key: string, value: Literal }[] = []
       while (this.current().type !== TokenType.RBRACE) {
          const key = this.consume(TokenType.IDENTIFIER).value
          this.consume(TokenType.COLON)
          // Expect Literal
          const valToken = this.current()
          let val: Literal
          if (valToken.type === TokenType.STRING) {
             val = { type: 'Literal', value: valToken.value, raw: valToken.value, location: valToken }
             this.advance()
          } else {
              throw new Error("Expected string literal in model definition")
          }
          properties.push({ key, value: val })
          if (this.current().type === TokenType.COMMA) this.advance()
      }
      this.consume(TokenType.RBRACE)
      return { type: 'ModelDeclaration', name, properties, location: start }
  }

  private parseImportDeclaration(): ImportDeclaration {
       const start = this.consume(TokenType.IMPORT)
       const specifiers: { local: string, imported: string }[] = []
       let source = ""
       
       if (this.match(TokenType.LBRACE)) {
           do {
               const imported = this.consume(TokenType.IDENTIFIER, "Expected imported name").value
               let local = imported
               if (this.match(TokenType.AS)) {
                   local = this.consume(TokenType.IDENTIFIER, "Expected local alias").value
               }
               specifiers.push({ local, imported })
           } while (this.match(TokenType.COMMA))
           this.consume(TokenType.RBRACE, "Expected '}'")
           
           this.consume(TokenType.FROM, "Expected 'from'")
           const srcToken = this.consume(TokenType.STRING, "Expected module path string")
            source = srcToken.value
       } else if (this.match(TokenType.MULTIPLY)) {
            this.consume(TokenType.AS, "Expected 'as' after '*'")
            const local = this.consume(TokenType.IDENTIFIER, "Expected namespace name").value
            specifiers.push({ local, imported: "*" })
            
            this.consume(TokenType.FROM, "Expected 'from'")
            const srcToken = this.consume(TokenType.STRING, "Expected module path string")
            source = srcToken.value
       } else if (this.current().type === TokenType.IDENTIFIER) {
            const first = this.consume(TokenType.IDENTIFIER).value
            
            if (this.match(TokenType.FROM)) {
                specifiers.push({ local: first, imported: "default" })
                const srcToken = this.consume(TokenType.STRING, "Expected module path string")
                source = srcToken.value
            } else {
                source = first
                while (this.match(TokenType.DOT)) {
                    source += "." + this.consume(TokenType.IDENTIFIER).value
                }
            }
       } else if (this.current().type === TokenType.STRING) {
            source = this.consume(TokenType.STRING).value
       } else {
            throw new Error("Unexpected import syntax")
       }
       
       return { 
           type: 'ImportDeclaration', 
           source, 
           location: start 
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

  // ExportDeclaration removed
  


  private parseFunctionDeclaration(): FunctionDeclaration {
      const startToken = this.current()
      let isPub = false
      let isAsync = false
      
      if (this.match(TokenType.PUB)) isPub = true
      if (this.match(TokenType.ASYNC)) isAsync = true
      
      if (this.match(TokenType.MAKE)) {
          // consumed 'make'
      } else {
          this.consume(TokenType.FUNC, "Expected 'fn' or 'make'")
      }
      const name = this.consume(TokenType.IDENTIFIER, "Expected function name").value
      
      this.consume(TokenType.LPAREN, "Expected '(' after function name")

      const params: { name: string, typeAnnotation?: TypeAnnotation }[] = []
      
      if (this.current().type !== TokenType.RPAREN) {
          do {
              const paramName = this.consume(TokenType.IDENTIFIER, "Expected parameter name").value
              let typeAnnotation: TypeAnnotation | undefined
              if (this.match(TokenType.COLON)) {
                  typeAnnotation = this.parseTypeAnnotation()
              }
              params.push({ name: paramName, typeAnnotation })
          } while (this.match(TokenType.COMMA))
      }
      this.consume(TokenType.RPAREN, "Expected ')' after parameters")
      
      let returnType: TypeAnnotation | undefined
      if (this.match(TokenType.ARROW)) { // ->
          returnType = this.parseTypeAnnotation()
      }
      
      let body: BlockStatement
      if (this.match(TokenType.FAT_ARROW)) {
           const expr = this.parseExpression()
           body = {
               type: 'BlockStatement',
               body: [{
                   type: 'ReturnStatement',
                   argument: expr,
                   location: expr.location // Simplified location
               }],
               location: expr.location
           }
      } else {
           body = this.parseBlock()
      }
      
      return {
          type: 'FunctionDeclaration',
          name,
          params,
          returnType,
          body,
          isPub,
          isAsync,
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
      const token = this.current()
      if (token.type === TokenType.WHEN) {
          this.consume(TokenType.WHEN)
      } else {
          this.consume(TokenType.IF)
      }
      const startToken = token
      
      let test: Expression
      if (this.match(TokenType.LPAREN)) {
           test = this.parseExpression()
           this.consume(TokenType.RPAREN, "Expected ')' after condition")
      } else {
           test = this.parseExpression()
      }
      
      // Optional DO
      this.match(TokenType.DO)
      
      let consequent: BlockStatement
      if (this.current().type === TokenType.LBRACE) {
          consequent = this.parseBlock()
      } else {
           const stmt = this.parseStatement()
           if (!stmt) throw new Error("Expected statement")
           consequent = {
               type: 'BlockStatement',
               body: [stmt as Statement],
               location: stmt.location
           }
      }
      
      let alternate: BlockStatement | undefined | IfStatement
      
      if (this.match(TokenType.ELSE)) {
          if (this.current().type === TokenType.IF || this.current().type === TokenType.WHEN) {
              // else if / else when
              alternate = this.parseIfStatement()
          } else if (this.current().type === TokenType.LBRACE) {
              alternate = this.parseBlock()
          } else {
              const stmt = this.parseStatement()
              if (!stmt) throw new Error("Expected statement after else")
               alternate = {
                   type: 'BlockStatement',
                   body: [stmt as Statement],
                   location: stmt.location
               }
          }
      }
      
      return {
          type: 'IfStatement',
          test,
          consequent,
          alternate, // Type mismatch in AST? IfStatement defines alternate?
          location: { line: startToken.line, column: startToken.column }
      }
  }

  private parseWhileStatement(): WhileStatement {
      const startToken = this.consume(TokenType.WHILE)
      const test = this.parseExpression()
      const body = this.parseBlock()
      return {
          type: 'WhileStatement',
          test,
          body,
          location: startToken
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
    const left = this.parseBinaryExpression(0)
    
    if (this.match(TokenType.ASSIGN)) {
        const right = this.parseExpression()
        return {
            type: 'AssignmentExpression',
            left,
            right,
            location: left.location
        } as AssignmentExpression
    }
    
    return left
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
    let left = this.parseUnary()
    
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

  private parseUnary(): Expression {
      if (this.current().type === TokenType.AWAIT) {
           const token = this.advance()
           const arg = this.parseUnary()
           return {
               type: 'AwaitExpression',
               argument: arg,
               location: token
           } as unknown as Expression
      }
      return this.parsePrimary()
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
        let expr: Expression = { type: 'Identifier', name: token.value, location: token }
        
        // Handle suffixes: Call (foo()) or Member (foo.bar) or Index (foo[1])
        while (true) {
            if (this.match(TokenType.LPAREN)) {
                expr = this.finishCall(expr)
            } else if (this.match(TokenType.DOT)) {
                const propName = this.consume(TokenType.IDENTIFIER, "Expected property name after '.'")
                expr = {
                    type: 'MemberExpression',
                    object: expr,
                    property: { type: 'Identifier', name: propName.value, location: propName },
                    location: expr.location
                } as MemberExpression
            } else {
                break
            }
        }
        
        return expr
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

    if (token.type === TokenType.IF) {
        // If Expression
        const stmt = this.parseIfStatement()
        // Convert Statement to Expression wrapper
        return {
            type: 'IfStatement', // Reusing IfStatement node for expression context
            test: stmt.test,
            consequent: stmt.consequent,
            alternate: stmt.alternate,
            location: stmt.location
        } as unknown as Expression 
    }

    if (token.type === TokenType.FUNC) {
        return this.parseFunctionExpression()
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

  private parseFunctionExpression(): FunctionExpression {
      const startToken = this.consume(TokenType.FUNC)
      let name: string | undefined
      if (this.current().type === TokenType.IDENTIFIER) {
          name = this.consume(TokenType.IDENTIFIER).value
      }
      
      this.consume(TokenType.LPAREN, "Expected '('")
      const params: string[] = []
      if (this.current().type !== TokenType.RPAREN) {
          do {
              params.push(this.consume(TokenType.IDENTIFIER, "Expected parameter name").value
          )
          } while (this.match(TokenType.COMMA))
      }
      this.consume(TokenType.RPAREN, "Expected ')'")
      
      let body: BlockStatement
      if (this.match(TokenType.FAT_ARROW)) {
           const expr = this.parseExpression()
           body = {
               type: 'BlockStatement',
               location: expr.location,
               body: [{
                   type: 'ExpressionStatement',
                   expression: expr,
                   location: expr.location
               } as ASTNode] 
           }
      } else {
          body = this.parseBlock()
      }
      
      return {
          type: 'FunctionExpression',
          name,
          params,
          body,
          location: startToken
      }
  }

  
  private finishCall(callee: Expression): CallExpression {
      // LPAREN consumed by caller (parsePrimary loop) as checked via match()
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

