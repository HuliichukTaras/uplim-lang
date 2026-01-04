

export enum TokenType {
  // Keywords
  LET = 'LET',
  CONST = 'CONST',
  FUNC = 'FUNC', // func or f
  MAKE = 'MAKE', // keep for backward compat until full migration
  SAY = 'SAY',   // keep for backward compat or alias to print
  IF = 'IF',
  ELSE = 'ELSE',
  WHILE = 'WHILE',
  LOOP = 'LOOP',
  FOR = 'FOR',
  WHEN = 'WHEN',
  DO = 'DO',
  IN = 'IN',
  MATCH = 'MATCH',
  RETURN = 'RETURN',
  STRUCT = 'STRUCT',
  ENUM = 'ENUM',
  IMPORT = 'IMPORT',
  EXPORT = 'EXPORT',
  FROM = 'FROM',
  AS = 'AS',
  ASYNC = 'ASYNC',
  AWAIT = 'AWAIT',
  SPAWN = 'SPAWN',
  BREAK = 'BREAK',
  
  // Type Keywords (Basic)
  TYPE_INT = 'TYPE_INT',
  TYPE_FLOAT = 'TYPE_FLOAT',
  TYPE_BOOL = 'TYPE_BOOL',
  TYPE_STRING = 'TYPE_STRING',
  TYPE_VOID = 'TYPE_VOID',
  
  // Literals
  IDENTIFIER = 'IDENTIFIER',
  NUMBER = 'NUMBER',
  STRING = 'STRING',

  // New Keywords v0.1
  VAR = 'VAR',
  PUB = 'PUB',
  MODEL = 'MODEL',
  EXTERN = 'EXTERN',
  TYPE_ANY = 'TYPE_ANY',
  
  // Syntax
  ASSIGN = 'ASSIGN', // =
  FAT_ARROW = 'FAT_ARROW',   // =>
  ARROW = 'ARROW',   // ->
  COLON = 'COLON',   // :
  DOT = 'DOT',       // .
  DOUBLE_COLON = 'DOUBLE_COLON', // ::
  DOT_DOT = 'DOT_DOT', // ..
  ELLIPSIS = 'ELLIPSIS', // ...
  PIPE = 'PIPE',     // |
  PIPE_OP = 'PIPE_OP', // |>
  LPAREN = 'LPAREN', // (
  RPAREN = 'RPAREN', // )
  LBRACE = 'LBRACE', // {
  RBRACE = 'RBRACE', // }
  LBRACKET = 'LBRACKET', // [
  RBRACKET = 'RBRACKET', // ]
  COMMA = 'COMMA',   // ,
  SEMICOLON = 'SEMICOLON', // ;
  
  // Operators
  PLUS = 'PLUS',
  MINUS = 'MINUS',
  MULTIPLY = 'MULTIPLY',
  DIVIDE = 'DIVIDE',
  GT = 'GT', // >
  LT = 'LT', // <
  
  BY = 'BY', // by

  EOF = 'EOF'
}

export interface Token {
  type: TokenType
  value: string
  line: number
  column: number
}

export class Lexer {
  private source: string
  private position: number = 0
  private line: number = 1
  private column: number = 1
  
  constructor(source: string) {
    this.source = source
  }
  
  tokenize(): Token[] {
    const tokens: Token[] = []
    
    while (this.position < this.source.length) {
      const char = this.current()
      
      if (this.isWhitespace(char)) {
        this.advance()
        continue
      }
      
      if (this.isAlpha(char)) {
        tokens.push(this.readIdentifier())
        continue
      }
      
      if (this.isDigit(char)) {
        tokens.push(this.readNumber())
        continue
      }
      
      if (char === '"') {
        tokens.push(this.readString())
        continue
      }
      


      if (char === '/' && this.peek() === '/') {
        this.skipLineComment()
        continue
      }

      if (char === '/' && this.peek() === '*') {
        this.skipBlockComment()
        continue
      }
      
      if (char === '#') {
          this.skipLineComment() // Support # comments for backward compat
          continue
      }
      
      // Single-char tokens
      switch (char) {

        case '(': tokens.push(this.createToken(TokenType.LPAREN, '(')); break
        case ')': tokens.push(this.createToken(TokenType.RPAREN, ')')); break
        case '=': 
          if (this.peek() === '>') {
             this.advance(); tokens.push(this.createToken(TokenType.FAT_ARROW, '=>'))
          } else {
             tokens.push(this.createToken(TokenType.ASSIGN, '='))
          }
          break
        case '|': 
          if (this.peek() === '>') {
             this.advance(); tokens.push(this.createToken(TokenType.PIPE_OP, '|>')) 
          } else {
             tokens.push(this.createToken(TokenType.PIPE, '|'))
          }
          break
        case '.':
          if (this.peek() === '.') {
             this.advance()
             if (this.peek() === '.') {
                 this.advance(); tokens.push(this.createToken(TokenType.ELLIPSIS, '...'))
             } else {
                 tokens.push(this.createToken(TokenType.DOT_DOT, '..'))
             }
          } else {
             tokens.push(this.createToken(TokenType.DOT, '.'))
          }
          break
        case ':':
          if (this.peek() === ':') {
             this.advance(); tokens.push(this.createToken(TokenType.DOUBLE_COLON, '::'))
          } else {
             tokens.push(this.createToken(TokenType.COLON, ':'))
          }
          break
        case '{': tokens.push(this.createToken(TokenType.LBRACE, '{')); break
        case '}': tokens.push(this.createToken(TokenType.RBRACE, '}')); break
        case '[': tokens.push(this.createToken(TokenType.LBRACKET, '[')); break
        case ']': tokens.push(this.createToken(TokenType.RBRACKET, ']')); break
        case ',': tokens.push(this.createToken(TokenType.COMMA, ',')); break
        case ';': tokens.push(this.createToken(TokenType.SEMICOLON, ';')); break
        case '+': tokens.push(this.createToken(TokenType.PLUS, '+')); break
        case '-': 
          if (this.peek() === '>') {
              this.advance(); 
              tokens.push(this.createToken(TokenType.ARROW, '->'))
          } else {
              tokens.push(this.createToken(TokenType.MINUS, '-')); 
          }
          break
        case '*': tokens.push(this.createToken(TokenType.MULTIPLY, '*')); break
        case '/': tokens.push(this.createToken(TokenType.DIVIDE, '/')); break
        case '>': tokens.push(this.createToken(TokenType.GT, '>')); break
        case '<': tokens.push(this.createToken(TokenType.LT, '<')); break
        default:
          // console.warn(`Unexpected character: ${char} at ${this.line}:${this.column}`)
      }
      
      this.advance()
    }
    
    tokens.push(this.createToken(TokenType.EOF, ''))
    return tokens
  }
  
  private current(): string {
    return this.source[this.position]
  }
  
  private peek(): string {
    if (this.position + 1 >= this.source.length) return ''
    return this.source[this.position + 1]
  }
  
  private advance(n: number = 1) {
    for (let i = 0; i < n; i++) {
        if (this.position >= this.source.length) break;
        if (this.current() === '\n') {
            this.line++
            this.column = 1
        } else {
            this.column++
        }
        this.position++
    }
  }
  
  private createToken(type: TokenType, value: string): Token {
    return { type, value, line: this.line, column: this.column }
  }
  
  private isWhitespace(char: string): boolean {
    return /\s/.test(char)
  }
  
  private isAlpha(char: string): boolean {
    return /[a-zA-Z_]/.test(char)
  }
  
  private isDigit(char: string): boolean {
    return /[0-9]/.test(char)
  }
  
  private readIdentifier(): Token {
    const startLine = this.line
    const startCol = this.column
    let value = ''
    
    while (this.position < this.source.length && (this.isAlpha(this.current()) || this.isDigit(this.current()))) {
      value += this.current()
      this.advance()
    }
    
    const type = this.getKeywordType(value) || TokenType.IDENTIFIER
    return { type, value, line: startLine, column: startCol }
  }
  
  private getKeywordType(value: string): TokenType | undefined {
    switch (value) {
      case 'let': 
      case 'l': return TokenType.LET
      
      case 'const': return TokenType.CONST
      
      case 'fn': 
      case 'func': // v0.1
        return TokenType.FUNC
        
      case 'make': return TokenType.MAKE
      case 'say': return TokenType.SAY
      case 'p': return TokenType.SAY // short for print/say
      case 'print': return TokenType.SAY // alias
      
      case 'if': return TokenType.IF
      case 'else':
      case 'e': return TokenType.ELSE
      case 'while': return TokenType.WHILE
      case 'loop': return TokenType.LOOP
      case 'for': return TokenType.FOR
      case 'when': return TokenType.WHEN
      case 'do': return TokenType.DO
      case 'in': return TokenType.IN
      case 'break': return TokenType.BREAK
      case 'by': return TokenType.BY
      
      case 'match':
      case 'm': return TokenType.MATCH
      
      case 'return':
      case 'ret': return TokenType.RETURN
      
      case 'struct': return TokenType.STRUCT
      case 'enum': return TokenType.ENUM
      
      case 'import': return TokenType.IMPORT
      case 'export': return TokenType.EXPORT
      case 'from': return TokenType.FROM
      case 'as': return TokenType.AS
      
      case 'async': return TokenType.ASYNC
      case 'await': return TokenType.AWAIT
      case 'spawn': return TokenType.SPAWN
      
      case 'var': return TokenType.VAR
      case 'pub': return TokenType.PUB
      case 'model': return TokenType.MODEL
      case 'extern': return TokenType.EXTERN
      
      case 'Any': return TokenType.TYPE_ANY

      // Types
      case 'Int': return TokenType.TYPE_INT
      case 'Float': return TokenType.TYPE_FLOAT
      case 'Bool': return TokenType.TYPE_BOOL
      case 'String': return TokenType.TYPE_STRING
      case 'Void': return TokenType.TYPE_VOID

      default: return undefined
    }
  }
  
  private readNumber(): Token {
    const startLine = this.line
    const startCol = this.column
    let value = ''
    
    while (this.position < this.source.length && this.isDigit(this.current())) {
      value += this.current()
      this.advance()
    }
    
    // Handle float
    if (this.current() === '.' && this.isDigit(this.peek())) {
        value += '.'
        this.advance()
        while (this.position < this.source.length && this.isDigit(this.current())) {
            value += this.current()
            this.advance()
        }
    }
    
    return { type: TokenType.NUMBER, value, line: startLine, column: startCol }
  }
  
  private readString(): Token {
    const startLine = this.line
    const startCol = this.column
    this.advance() // Skip opening quote
    let value = ''
    
    while (this.position < this.source.length && this.current() !== '"') {
      value += this.current()
      this.advance()
    }
    
    this.advance() // Skip closing quote
    return { type: TokenType.STRING, value, line: startLine, column: startCol }
  }

  private skipLineComment() {
    while (this.position < this.source.length && this.current() !== '\n') {
      this.advance()
    }
  }

  private skipBlockComment() {
    this.advance(2) // Skip /*
    while (this.position < this.source.length - 1) {
      if (this.current() === '*' && this.peek() === '/') {
        this.advance(2)
        return
      }
      this.advance()
    }
  }
}

